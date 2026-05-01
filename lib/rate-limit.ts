type Bucket = {
  count: number;
  windowStartMs: number;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_MINUTE = 5;
const MAX_PER_HOUR = 20;

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
    return { allowed: false, remaining: 0, resetMs: existing.windowStartMs + windowMs };
  }

  const updated = { count: existing.count + 1, windowStartMs: existing.windowStartMs };
  map.set(key, updated);
  return { allowed: true, remaining: max - updated.count, resetMs: updated.windowStartMs + windowMs };
}

export function checkRateLimit(ip: string): RateLimitResult {
  const minute = checkBucket(minuteBuckets, ip, MINUTE_MS, MAX_PER_MINUTE);
  if (!minute.allowed) return minute;

  const hour = checkBucket(hourBuckets, ip, HOUR_MS, MAX_PER_HOUR);
  return hour;
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
