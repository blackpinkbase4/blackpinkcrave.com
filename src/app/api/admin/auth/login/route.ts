import { NextRequest, NextResponse } from "next/server";
import { getAdminSecret, createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, hashClientIp } from "@/lib/rate-limit";
import { logAuditAction } from "@/lib/supabase/db";

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const ipHash = hashClientIp(ip);

    // Rate limit login attempts: 5 per 5 minutes per IP
    const rateLimit = checkRateLimit(`login:${ipHash}`, 5, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const password = body.password || body.secret;

    const expectedPassword = getAdminSecret();
    if (!password || password.trim() !== expectedPassword.trim()) {
      await logAuditAction("FAILED_LOGIN_ATTEMPT", { ip_hash: ipHash }, ip);
      return NextResponse.json(
        { success: false, error: "Invalid password." },
        { status: 401 }
      );
    }

    // Create session token
    const token = createSessionToken();
    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully.",
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    await logAuditAction("ADMIN_LOGIN", { status: "success" }, ip);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
