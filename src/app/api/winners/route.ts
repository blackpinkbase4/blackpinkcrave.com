import { NextResponse } from "next/server";
import { getEventSettings, getCategoryResults } from "@/lib/supabase/db";

export async function GET() {
  try {
    const settings = await getEventSettings();

    // STRICT PRIVACY ENFORCEMENT: Never return vote totals or nominee tallies before publication
    if (!settings.winners_published) {
      return NextResponse.json({
        published: false,
        reveal_date_display: settings.reveal_date_display || "Coming Soon",
        message: "THE WINNERS ARE UNDER WRAPS.",
      });
    }

    const results = await getCategoryResults(true);

    return NextResponse.json({
      published: true,
      reveal_date_display: settings.reveal_date_display,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching winners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
