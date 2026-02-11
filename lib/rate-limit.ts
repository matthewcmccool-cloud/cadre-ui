/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * NOTE: In-memory only — resets on deploy/restart. Fine for MVP;
 * swap to Redis (Upstash) for production at scale.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check and consume a rate limit token.
 *
 * @param key    — unique identifier (IP address or userId)
 * @param limit  — max requests allowed in the window
 * @param windowMs — window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/** Helper to extract IP from request headers (works on Vercel). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}
