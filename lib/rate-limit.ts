type Bucket = {
  count: number;
  windowStartMs: number;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Legacy per-IP limits (feedback form submissions, etc.).
const MAX_PER_MINUTE = 5;
const MAX_PER_HOUR = 20;

// Per-token tiered limits (req/min). Hour limit derived as 30× the minute cap.
export type RateLimitTier = "default" | "agent" | "owner";
const TIER_PER_MINUTE: Record<RateLimitTier, number> = {
  default: 60,
  agent: 300,
  owner: 1000,
};

const minuteBuckets = new Map<string, Bucket>();
const hourBuckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
};

function checkBucket(
  map: Map<string, Bucket>,
  key: string,
  windowMs: number,
  max: number,
): RateLimitResult {
  const now = Date.now();
  const existing = map.get(key);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    map.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: max - 1, resetMs: now + windowMs };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: existing.windowStartMs + windowMs,
    };
  }

  const updated = {
    count: existing.count + 1,
    windowStartMs: existing.windowStartMs,
  };
  map.set(key, updated);
  return {
    allowed: true,
    remaining: max - updated.count,
    resetMs: updated.windowStartMs + windowMs,
  };
}

export function checkRateLimit(ip: string): RateLimitResult {
  const minute = checkBucket(minuteBuckets, ip, MINUTE_MS, MAX_PER_MINUTE);
  if (!minute.allowed) return minute;

  const hour = checkBucket(hourBuckets, ip, HOUR_MS, MAX_PER_HOUR);
  return hour;
}

// Per-token limits — keyed on token_id, tier-scaled. Falls back to IP-keyed
// bucket for anon calls so anonymous abuse can't ride on the token budget.
export function checkTokenRateLimit(
  tokenId: string | null,
  ip: string,
  tier: RateLimitTier = "default",
): RateLimitResult {
  const key = tokenId ? `token:${tokenId}` : `ip:${ip}`;
  const perMinute = tokenId ? TIER_PER_MINUTE[tier] : MAX_PER_MINUTE;
  return checkBucket(minuteBuckets, key, MINUTE_MS, perMinute);
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
