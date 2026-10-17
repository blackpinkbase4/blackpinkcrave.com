import { NextResponse } from "next/server";
import { getCategories, getNominees } from "@/lib/supabase/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await getCategories(false);
    const allNominees = await getNominees(undefined, false);

    // Attach count of active nominees
    const enriched = categories.map((cat) => ({
      ...cat,
      nominee_count: allNominees.filter((n) => n.category_id === cat.id).length,
    }));

    return NextResponse.json({ categories: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
