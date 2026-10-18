import { NextResponse } from "next/server";
import { getEventSettings } from "@/lib/supabase/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getEventSettings();
    return NextResponse.json(
      {
        settings,
        isSupabaseConnected: isSupabaseConfigured(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          "CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          "Netlify-CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
