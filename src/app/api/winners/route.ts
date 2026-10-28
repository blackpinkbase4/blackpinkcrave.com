import { NextResponse } from "next/server";
import { getEventSettings, getCategoryResults } from "@/lib/supabase/db";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET() {
  try {
    const settings = await getEventSettings();

    // STRICT PRIVACY ENFORCEMENT: Never return vote totals or nominee tallies before publication
    if (!settings.winners_published) {
      return NextResponse.json(
        {
          published: false,
          ceremony_mode: settings.ceremony_mode || "countdown",
          countdown_target: settings.countdown_target || "2026-10-28T20:00:00+05:30",
          reveal_date_display: settings.reveal_date_display || "Coming Soon",
          message: "THE WINNERS ARE UNDER WRAPS.",
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
          },
        }
      );
    }

    // Fast-path: When still in countdown room, respond instantly (5ms) without heavy vote queries
    if (settings.ceremony_mode === "countdown") {
      return NextResponse.json(
        {
          published: true,
          ceremony_mode: "countdown",
          countdown_target: settings.countdown_target || "2026-10-28T20:00:00+05:30",
          current_category_index: settings.current_category_index || 0,
          reveal_date_display: settings.reveal_date_display,
          results: [],
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
          },
        }
      );
    }

    const results = await getCategoryResults(true);

    return NextResponse.json(
      {
        published: true,
        ceremony_mode: settings.ceremony_mode || "unlocked",
        countdown_target: settings.countdown_target || "2026-10-28T20:00:00+05:30",
        current_category_index: settings.current_category_index || 0,
        reveal_date_display: settings.reveal_date_display,
        results: results || [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching winners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
