import { NextResponse } from "next/server";
import { getEventSettings } from "@/lib/supabase/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  try {
    const settings = await getEventSettings();
    return NextResponse.json({
      settings,
      isSupabaseConnected: isSupabaseConfigured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
