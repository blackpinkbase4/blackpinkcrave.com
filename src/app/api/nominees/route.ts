import { NextRequest, NextResponse } from "next/server";
import { getNominees } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId") || undefined;
    const finalistsOnly = searchParams.get("finalistsOnly") !== "false"; // Default true for voting

    const nominees = await getNominees(categoryId, finalistsOnly);
    return NextResponse.json({ nominees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
