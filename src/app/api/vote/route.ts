import { NextRequest, NextResponse } from "next/server";
import { submitVotes } from "@/lib/supabase/db";
import { validateXUsername } from "@/lib/validation";
import { checkRateLimit, hashClientIp } from "@/lib/rate-limit";
import { VoteSubmissionRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction and Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const ipHash = hashClientIp(ip);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const rateLimit = checkRateLimit(`vote:${ipHash}`, 30, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please wait a minute before submitting further votes.",
        },
        { status: 429 }
      );
    }

    // 2. Parse payload
    let body: VoteSubmissionRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { voter_username, category_id, allocations, captcha_token } = body;

    // 3. Optional CAPTCHA verification (if CAPTCHA_SECRET_KEY is configured in env)
    const captchaSecret = process.env.CAPTCHA_SECRET_KEY;
    if (captchaSecret && captchaSecret.trim() !== "") {
      if (!captcha_token) {
        return NextResponse.json(
          { success: false, error: "Security verification required. Please complete the CAPTCHA." },
          { status: 400 }
        );
      }
      try {
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(captcha_token)}&remoteip=${encodeURIComponent(ip)}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return NextResponse.json(
            { success: false, error: "CAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "CAPTCHA service unreachable. Please retry shortly." },
          { status: 502 }
        );
      }
    }

    // 4. Validate or auto-generate anonymous voter identifier
    let normalizedUser = "";
    if (voter_username && typeof voter_username === "string" && voter_username.trim() !== "") {
      const usernameValidation = validateXUsername(voter_username);
      if (usernameValidation.isValid) {
        normalizedUser = usernameValidation.normalized;
      }
    }
    if (!normalizedUser) {
      normalizedUser = `voter_${ipHash.substring(0, 10)}`;
    }

    if (!category_id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required." },
        { status: 400 }
      );
    }

    // 5. Fast in-memory validation of allocations
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please allocate at least 1 vote before submitting." },
        { status: 400 }
      );
    }

    let totalRequested = 0;
    for (const alloc of allocations) {
      if (!alloc.nominee_id || typeof alloc.nominee_id !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid nominee specified in votes." },
          { status: 400 }
        );
      }
      const v = Math.floor(Number(alloc.votes));
      if (isNaN(v) || v <= 0) {
        return NextResponse.json(
          { success: false, error: "Votes must be positive whole numbers." },
          { status: 400 }
        );
      }
      totalRequested += v;
    }

    if (totalRequested > 10) {
      return NextResponse.json(
        { success: false, error: "You cannot cast more than 10 votes in a category." },
        { status: 400 }
      );
    }

    // 6. Direct atomic submission (single fast PostgreSQL RPC with row-level locks)
    const result = await submitVotes(
      normalizedUser,
      category_id,
      allocations,
      ipHash,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          remaining_votes: result.remaining_votes,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cast ${result.votes_cast} vote(s)!`,
      votes_cast: result.votes_cast,
      total_used: result.total_used,
      remaining_votes: result.remaining_votes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Vote processing error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
