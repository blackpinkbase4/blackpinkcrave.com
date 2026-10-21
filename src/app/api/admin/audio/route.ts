import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase storage is not configured" }, { status: 500 });
    }

    // Generate clean unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const filename = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("gala-music")
      .upload(filename, buffer, {
        contentType: file.type || "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("gala-music").getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      filename,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error uploading audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
