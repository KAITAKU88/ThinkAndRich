import type { NextRequest } from "next/server";

// Fixed-window rate limiting on top of the KV namespace already bound for
// OTP codes (keys here are prefixed "rl:", so the two never collide).
//
// KV is eventually consistent and a read-then-write can lose a race, so the
// effective ceiling under a burst from many colocations is higher than the
// configured one. That is acceptable: the job here is to stop abuse and
// brute force, not to meter precisely.
//
// Free-plan KV allows ~1k writes/day, which rules out counting every request.
// Callers therefore meter only what is actually dangerous — failed
// authentication, OTP sends, client registration — and leave successful,
// already-authenticated traffic uncounted.

export interface RateLimitRule {
  limit: number;
  /** KV enforces a 60s minimum TTL, so anything shorter is rounded up. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** The only client identifier that can't be spoofed here — Cloudflare sets it. */
export function clientIp(request: NextRequest): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

function windowFor(bucket: string, identifier: string, rule: RateLimitRule) {
  const windowSeconds = Math.max(60, rule.windowSeconds);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowIndex = Math.floor(nowSeconds / windowSeconds);
  return {
    key: `rl:${bucket}:${identifier}:${windowIndex}`,
    windowSeconds,
    resetsIn: (windowIndex + 1) * windowSeconds - nowSeconds,
  };
}

// A KV outage must not take login or the MCP endpoint down with it — every
// path below fails open, losing throttling for the duration rather than the
// feature it protects.

/** Read-only check. Use where only *failed* attempts should count. */
export async function peekRateLimit(
  kv: KVNamespace,
  bucket: string,
  identifier: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const { key, resetsIn } = windowFor(bucket, identifier, rule);
  try {
    const current = Number((await kv.get(key)) ?? 0);
    return current >= rule.limit
      ? { allowed: false, remaining: 0, retryAfterSeconds: resetsIn }
      : { allowed: true, remaining: rule.limit - current, retryAfterSeconds: resetsIn };
  } catch {
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }
}

/** Counts one attempt against the window, without judging it. */
export async function recordRateLimitHit(
  kv: KVNamespace,
  bucket: string,
  identifier: string,
  rule: RateLimitRule
): Promise<void> {
  const { key, windowSeconds } = windowFor(bucket, identifier, rule);
  try {
    const current = Number((await kv.get(key)) ?? 0);
    await kv.put(key, String(current + 1), { expirationTtl: windowSeconds });
  } catch {
    // ignore — throttling is best-effort
  }
}

/** Check and count in one step, for endpoints where every call is the thing
 *  being limited (sending an OTP, registering a client). */
export async function checkRateLimit(
  kv: KVNamespace,
  bucket: string,
  identifier: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const result = await peekRateLimit(kv, bucket, identifier, rule);
  if (!result.allowed) return result;
  await recordRateLimitHit(kv, bucket, identifier, rule);
  return { ...result, remaining: Math.max(0, result.remaining - 1) };
}

export function tooManyRequests(message: string, retryAfterSeconds: number): Response {
  return Response.json(
    { ok: false, message },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) } }
  );
}
