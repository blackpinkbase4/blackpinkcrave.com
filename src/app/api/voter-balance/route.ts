import { NextRequest, NextResponse } from "next/server";
import { getVoterBalance } from "@/lib/supabase/db";
import { validateXUsername } from "@/lib/validation";
import { hashClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawUsername = searchParams.get("username");
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is a required query parameter." },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const ipHash = hashClientIp(ip);

    let normalized = "";
    if (rawUsername) {
      const { isValid, normalized: valNormalized } = validateXUsername(rawUsername);
      if (isValid) {
        normalized = valNormalized;
      }
    }
    if (!normalized) {
      normalized = `voter_${ipHash.substring(0, 10)}`;
    }

    const balance = await getVoterBalance(normalized, categoryId);
    return NextResponse.json(balance);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
