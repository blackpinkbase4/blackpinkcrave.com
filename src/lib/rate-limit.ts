import crypto from "crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

/**
 * Checks in-memory sliding window rate limit
 * @param key unique identifier (e.g. `vote:ip_hash` or `login:ip`)
 * @param limit maximum attempts within window
 * @param windowMs window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Hashes client IP to ensure GDPR/privacy compliance while tracking bot patterns
 */
export function hashClientIp(ip: string | null | undefined): string {
  if (!ip) return "unknown";
  const salt = process.env.ADMIN_SECRET || "noir_salt_2026";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").substring(0, 16);
}
