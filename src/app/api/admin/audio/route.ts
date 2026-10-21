import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { filename: rawFilename } = body;

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase storage is not configured" }, { status: 500 });
    }

    const ext = rawFilename ? rawFilename.split(".").pop()?.toLowerCase() || "mp3" : "mp3";
    const filename = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Create signed upload URL so the browser can upload directly to Supabase CDN
    // This completely bypasses Netlify's 6MB serverless body size limitation!
    const { data: signedData, error: signError } = await supabase.storage
      .from("gala-music")
      .createSignedUploadUrl(filename);

    if (signError || !signedData) {
      return NextResponse.json(
        { error: signError?.message || "Failed to create signed upload URL" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from("gala-music").getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      publicUrl: publicData.publicUrl,
      filename,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error initializing audio upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
