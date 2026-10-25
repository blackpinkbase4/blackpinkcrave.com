import { NextRequest, NextResponse } from "next/server";
import { submitNomination, getEventSettings } from "@/lib/supabase/db";
import { validateXUsername } from "@/lib/validation";
import { checkRateLimit, hashClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const ipHash = hashClientIp(ip);

    // Rate limit nominations: 15 submissions per 10 minutes per IP
    const rateLimit = checkRateLimit(`nominate:${ipHash}`, 15, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Submission rate limit reached. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const settings = await getEventSettings();
    if (!settings.nominations_open) {
      return NextResponse.json(
        { error: "Nomination submissions are currently closed by the admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category_id, x_username, display_name, avatar_url } = body;

    if (!category_id || !display_name?.trim()) {
      return NextResponse.json(
        { error: "Category and Display Name / Title are required." },
        { status: 400 }
      );
    }

    // Priority #5: Mandatory photo/visual upload
    if (!avatar_url || !avatar_url.trim()) {
      return NextResponse.json(
        { error: "A photo or cover artwork is mandatory for all nominations." },
        { status: 400 }
      );
    }

    // Auto-generate clean handle for music/artists if not a traditional twitter handle
    let cleanUsername = (x_username || "").trim();
    if (!cleanUsername) {
      cleanUsername = display_name.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "music";
    }

    const usernameValidation = validateXUsername(cleanUsername);
    const finalUsername = usernameValidation.isValid ? usernameValidation.normalized : cleanUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "nominee";

    const created = await submitNomination({
      category_id,
      x_username: finalUsername,
      display_name: display_name.trim(),
      avatar_url: avatar_url.trim(),
    });

    return NextResponse.json({
      success: true,
      message: `Nomination for @${created.x_username} submitted successfully!`,
      nominee: created,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error submitting nomination";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
