import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverSupabaseClient: SupabaseClient | null = null;
let publicSupabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith("http")) return false;
  if (url.includes("your-project.supabase.co")) return false;
  return Boolean(serviceKey || anonKey);
}

/**
 * Server-only Supabase client using Service Role key
 * WARNING: NEVER call this in client components!
 */
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  serverSupabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverSupabaseClient;
}

/**
 * Public browser-safe Supabase client using anon key
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (publicSupabaseClient) {
    return publicSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return null;

  publicSupabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });

  return publicSupabaseClient;
}
