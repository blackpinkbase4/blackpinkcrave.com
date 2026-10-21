import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getCategoryResults } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await getCategoryResults(false);
    if (!results) {
      return NextResponse.json({ error: "No results data available" }, { status: 404 });
    }

    // Generate CSV string
    const headers = [
      "Category ID",
      "Category Title",
      "Category Total Votes",
      "Nominee ID",
      "X Username",
      "Display Name",
      "Votes Received",
      "Category Vote Share (%)",
      "Winner Status",
      "Is Tied",
    ];

    const rows: string[][] = [headers];

    for (const cat of results) {
      for (const nom of cat.nominees) {
        rows.push([
          `"${cat.category_id}"`,
          `"${cat.category_title.replace(/"/g, '""')}"`,
          cat.total_votes.toString(),
          `"${nom.nominee_id}"`,
          `"@${nom.x_username}"`,
          `"${nom.display_name.replace(/"/g, '""')}"`,
          nom.votes.toString(),
          `${nom.percentage}%`,
          nom.is_winner ? (nom.is_tied ? "TIED WINNER" : "WINNER") : "NOMINEE",
          nom.is_tied ? "YES" : "NO",
        ]);
      }
    }

    const csvContent = rows.map((r) => r.join(",")).join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="noir-gala-26-2026-results-${Date.now()}.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error exporting results";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
