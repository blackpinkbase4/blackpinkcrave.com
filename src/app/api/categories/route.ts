import { NextResponse } from "next/server";
import { getCategories, getNominees } from "@/lib/supabase/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await getCategories(false);

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
