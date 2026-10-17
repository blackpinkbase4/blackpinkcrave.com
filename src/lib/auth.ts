import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "noir_admin_session";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 12; // 12 hours

export function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "noir_admin_secret_2026_change_in_production";
}

/**
 * Creates a signed session token: timestamp + signature
 */
export function createSessionToken(): string {
  const secret = getAdminSecret();
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`admin_session:${timestamp}`)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Verifies if a given session token is valid and not expired
 */
export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check age (12 hours)
  const now = Date.now();
  if (now - timestamp > SESSION_EXPIRY_SECONDS * 1000 || timestamp > now + 60000) {
    return false;
  }

  const secret = getAdminSecret();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`admin_session:${timestampStr}`)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verifies admin privileges from request cookies or header
 */
export function verifyAdminSession(req?: NextRequest): boolean {
  try {
    // 1. Check custom Authorization bearer token
    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        if (isValidSessionToken(token) || token === getAdminSecret()) {
          return true;
        }
      }
    }

    // 2. Check HTTP-only cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return isValidSessionToken(sessionCookie);
  } catch {
    return false;
  }
}
