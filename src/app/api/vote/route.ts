import { NextRequest, NextResponse } from "next/server";
import { submitVotes, getEventSettings } from "@/lib/supabase/db";
import { getServerSupabase } from "@/lib/supabase/client";
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

    const { voter_username, category_id, allocations, captcha_token, device_id } = body;

    // 3. Optional CAPTCHA verification
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

    // 5. Check Ceremony Settings: Cooldown & Power Hour Capacity
    const settings = await getEventSettings();
    if (!settings.voting_open) {
      return NextResponse.json(
        { success: false, error: "Voting is currently closed by the admin." },
        { status: 403 }
      );
    }

    const isPowerHour = Boolean(settings.power_hour_active);
    const maxCapacity = isPowerHour ? 30 : 10;
    const cooldownHours = settings.cooldown_hours || 3;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    // 6. Fast in-memory validation of allocations
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

    if (totalRequested > maxCapacity) {
      return NextResponse.json(
        {
          success: false,
          error: `You cannot cast more than ${maxCapacity} votes in this category (${isPowerHour ? "Power Hour limit: 30" : "Standard limit: 10"}).`,
        },
        { status: 400 }
      );
    }

    // 7. Device Cooldown Enforcement: Prevent changing username to spam ballots
    const cleanDeviceId =
      (typeof device_id === "string" ? device_id.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 32) : "") ||
      `dev_${ipHash.substring(0, 10)}`;

    const cutoff = new Date(Date.now() - cooldownMs).toISOString();
    const supabase = getServerSupabase();

    if (supabase && cleanDeviceId) {
      const { data: recentVotes } = await supabase
        .from("votes")
        .select("created_at")
        .eq("category_id", category_id)
        .ilike("user_agent", `%${cleanDeviceId}%`)
        .gt("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentVotes && recentVotes.length > 0) {
        const lastVoteTime = new Date(recentVotes[0].created_at).getTime();
        const nextUnlock = lastVoteTime + cooldownMs;
        const remainingMs = Math.max(0, nextUnlock - Date.now());
        const minsLeft = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          {
            success: false,
            error: `Device Cooldown Active: This device has already voted in this category. Next ballot unlocks in ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.`,
            remaining_ms: remainingMs,
          },
          { status: 429 }
        );
      }
    }

    const recordedUserAgent = `device:${cleanDeviceId} ${userAgent}`.substring(0, 255);
    const windowEpoch = Math.floor(Date.now() / cooldownMs);

    // 8. Tranche-based execution: Allows up to 30 votes during Power Hour while respecting 10-vote stored proc limits
    let totalVotesCast = 0;

    if (totalRequested > 10) {
      const tranches: { nominee_id: string; votes: number }[][] = [];
      let currentTranche: { nominee_id: string; votes: number }[] = [];
      let currentTrancheSum = 0;

      for (const alloc of allocations) {
        let remainingToPlace = Math.floor(alloc.votes);
        while (remainingToPlace > 0) {
          const spaceInTranche = 10 - currentTrancheSum;
          const take = Math.min(remainingToPlace, spaceInTranche);
          currentTranche.push({ nominee_id: alloc.nominee_id, votes: take });
          currentTrancheSum += take;
          remainingToPlace -= take;

          if (currentTrancheSum === 10) {
            tranches.push(currentTranche);
            currentTranche = [];
            currentTrancheSum = 0;
          }
        }
      }
      if (currentTranche.length > 0) {
        tranches.push(currentTranche);
      }

      let trancheIdx = 0;
      for (const tranche of tranches) {
        trancheIdx++;
        const trancheUser = `${normalizedUser}_p${trancheIdx}_w${windowEpoch}`;
        const res = await submitVotes(trancheUser, category_id, tranche, ipHash, recordedUserAgent);
        if (!res.success) {
          return NextResponse.json(
            { success: false, error: res.error || "Error processing power hour ballot tranche." },
            { status: 400 }
          );
        }
        totalVotesCast += res.votes_cast || 0;
      }
    } else {
      const voteUser = `${normalizedUser}_w${windowEpoch}`;
      const result = await submitVotes(
        voteUser,
        category_id,
        allocations,
        ipHash,
        recordedUserAgent
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
      totalVotesCast = result.votes_cast || totalRequested;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cast ${totalVotesCast} vote(s)!${isPowerHour ? " ⚡ Power Hour Triple Vote applied!" : ""}`,
      votes_cast: totalVotesCast,
      is_power_hour: isPowerHour,
      cooldown_hours: cooldownHours,
      cooldown_ms: cooldownMs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Vote processing error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
