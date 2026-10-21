/**
 * Migration Script: Safely move base64 nominee avatars to Supabase Cloud CDN Storage
 * 
 * Rules:
 * 1. Operates row-by-row with delays to NEVER block live voting traffic
 * 2. Idempotent: Can be run multiple times safely
 * 3. Never deletes or alters any nominee metadata or vote tallies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1];
const sb = createClient(url, key);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function migrate() {
  console.log('🚀 Starting safe avatar migration to Supabase Cloud Storage (CDN)...');

  // Fetch all nominees (only id, display_name, x_username, and avatar_url)
  // Fetching in small category chunks to prevent large memory usage
  const { data: categories, error: catErr } = await sb
    .from('categories')
    .select('id, title')
    .order('display_order');

  if (catErr) {
    console.error('Failed to fetch categories:', catErr.message);
    return;
  }

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const cat of categories) {
    console.log(`\n📂 Checking category: ${cat.title} (${cat.id})...`);

    // Fetch nominees for this category
    const { data: nominees, error: nomErr } = await sb
      .from('nominees')
      .select('id, x_username, display_name, avatar_url')
      .eq('category_id', cat.id);

    if (nomErr) {
      console.error(`   ❌ Failed to fetch nominees for ${cat.id}:`, nomErr.message);
      continue;
    }

    console.log(`   Found ${nominees.length} nominees in ${cat.title}`);

    for (const nominee of nominees) {
      if (!nominee.avatar_url) {
        totalSkipped++;
        continue;
      }

      // If already a CDN link, skip
      if (nominee.avatar_url.startsWith('http://') || nominee.avatar_url.startsWith('https://')) {
        totalSkipped++;
        continue;
      }

      // Check if it's a base64 image
      if (nominee.avatar_url.startsWith('data:image/')) {
        try {
          const match = nominee.avatar_url.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            console.warn(`   ⚠️ Invalid data URL format for @${nominee.x_username}`);
            totalErrors++;
            continue;
          }

          const mimeType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');

          let ext = 'jpg';
          if (mimeType.includes('png')) ext = 'png';
          else if (mimeType.includes('webp')) ext = 'webp';
          else if (mimeType.includes('gif')) ext = 'gif';

          const fileName = `${nominee.id}.${ext}`;

          // Upload to Supabase Storage bucket
          const { error: uploadErr } = await sb.storage
            .from('nominee-avatars')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadErr) {
            console.error(`   ❌ Upload error for @${nominee.x_username}:`, uploadErr.message);
            totalErrors++;
            continue;
          }

          // Get public CDN URL
          const { data: pubData } = sb.storage
            .from('nominee-avatars')
            .getPublicUrl(fileName);

          const cdnUrl = pubData.publicUrl;

          // Update nominee row with the small CDN URL
          const { error: updateErr } = await sb
            .from('nominees')
            .update({ avatar_url: cdnUrl })
            .eq('id', nominee.id);

          if (updateErr) {
            console.error(`   ❌ DB update error for @${nominee.x_username}:`, updateErr.message);
            totalErrors++;
            continue;
          }

          totalMigrated++;
          const kbSize = Math.round(buffer.length / 1024);
          console.log(`   ✅ Migrated @${nominee.x_username} (${kbSize} KB) -> ${cdnUrl}`);

          // Gentle pause to ensure zero database load for active voters
          await sleep(120);
        } catch (err) {
          console.error(`   ❌ Exception migrating @${nominee.x_username}:`, err.message);
          totalErrors++;
        }
      }
    }
  }

  console.log('\n=============================================');
  console.log(`🎉 Migration Completed!`);
  console.log(`   Successfully Migrated: ${totalMigrated} photos to CDN`);
  console.log(`   Skipped (Already CDN or No Photo): ${totalSkipped}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('=============================================\n');
}

migrate().catch(console.error);
