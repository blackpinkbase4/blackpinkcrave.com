import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Delete all rows in votes table
    const { error } = await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "All votes purged successfully to 0!" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to purge votes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
