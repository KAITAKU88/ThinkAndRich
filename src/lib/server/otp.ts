import { and, eq, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { authOtps } from "@/db/schema";
import { OTP_TTL_SECONDS } from "@/lib/otp-policy";
export { OTP_TTL_MINUTES, OTP_TTL_SECONDS } from "@/lib/otp-policy";

/**
 * KV key used by older local tooling (`npm run otp`, e2e helpers) when a
 * leftover code still lives in the simulator. Login itself no longer reads
 * or writes this — codes live in D1 (`auth_otps`).
 */
export function otpKey(email: string, code: string): string {
  return `otp:${email}:${code}`;
}

export function randomOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function normalizeOtpCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function otpIsLive(expiresAt: string, now = Date.now()): boolean {
  return Date.parse(expiresAt) > now;
}

export async function storeOtp(db: DrizzleD1Database, email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
  await db
    .insert(authOtps)
    .values({ email, code, expiresAt })
    .onConflictDoUpdate({
      target: [authOtps.email, authOtps.code],
      set: { expiresAt },
    });
  try {
    await db.delete(authOtps).where(lt(authOtps.expiresAt, new Date().toISOString()));
  } catch {
    // Housekeeping only — redemption re-checks expiry.
  }
}

export async function consumeOtp(
  db: DrizzleD1Database,
  email: string,
  code: string
): Promise<boolean> {
  const row = await db
    .select()
    .from(authOtps)
    .where(and(eq(authOtps.email, email), eq(authOtps.code, code)))
    .get();
  if (!row) return false;
  await db.delete(authOtps).where(and(eq(authOtps.email, email), eq(authOtps.code, code)));
  return otpIsLive(row.expiresAt);
}
