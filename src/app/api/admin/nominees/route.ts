import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import {
  getNominees,
  submitNomination,
  deleteNominee,
  rollRandomFinalists,
  toggleFinalistStatus,
} from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId") || undefined;
    const nominees = await getNominees(categoryId, false); // Admin sees all nominations
    return NextResponse.json({ nominees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const body = await req.json();
    const { action, id, category_id, data } = body;

    // 1. Roll Random 8 Finalists for category
    if (action === "roll_8") {
      if (!category_id) {
        return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
      }
      const finalists = await rollRandomFinalists(category_id, 8, ip);
      return NextResponse.json({ success: true, finalists });
    }

    // 2. Toggle Finalist Status
    if (action === "toggle_finalist") {
      if (!id || typeof data?.is_finalist !== "boolean") {
        return NextResponse.json({ error: "Nominee ID and is_finalist boolean are required" }, { status: 400 });
      }
      const updated = await toggleFinalistStatus(id, data.is_finalist, ip);
      return NextResponse.json({ success: true, nominee: updated });
    }

    // 3. Create nominee
    if (action === "create") {
      const created = await submitNomination(data);
      if (data.is_finalist) {
        await toggleFinalistStatus(created.id, true, ip);
      }
      return NextResponse.json({ success: true, nominee: created });
    }

    // 4. Delete nominee
    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Nominee ID is required" }, { status: 400 });
      await deleteNominee(id, ip);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
