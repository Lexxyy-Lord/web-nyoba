import { AppError } from "@/lib/http";

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new AppError("RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar.", 429, { retryAfterMs: current.resetAt - now });
  }
  current.count += 1;
}

export function clearExpiredRateLimits() {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}
