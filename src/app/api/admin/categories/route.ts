import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNominees,
} from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await getCategories(true);
    const nominees = await getNominees(undefined, true);

    const enriched = categories.map((cat) => ({
      ...cat,
      nominee_count: nominees.filter((n) => n.category_id === cat.id).length,
    }));

    return NextResponse.json({ categories: enriched });
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
    const { action, id, data } = body;

    if (action === "create") {
      if (!data || !data.title) {
        return NextResponse.json({ error: "Category title is required" }, { status: 400 });
      }
      const created = await createCategory(data, ip);
      return NextResponse.json({ success: true, category: created });
    }

    if (action === "update") {
      if (!id || !data) {
        return NextResponse.json({ error: "Category ID and data are required" }, { status: 400 });
      }
      const updated = await updateCategory(id, data, ip);
      return NextResponse.json({ success: true, category: updated });
    }

    if (action === "set_winner") {
      if (!id) {
        return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
      }
      const updated = await updateCategory(id, { winner_nominee_id: data?.nominee_id || null }, ip);
      return NextResponse.json({ success: true, category: updated });
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
      }
      await deleteCategory(id, ip);
      return NextResponse.json({ success: true, message: `Category ${id} deleted` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing category action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
