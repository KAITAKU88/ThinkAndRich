import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { appSettings, users } from "@/db/schema";
import { peekRateLimit, recordRateLimitHit, tooManyRequests } from "@/lib/server/rate-limit";
import { consumeOtp, normalizeOtpCode } from "@/lib/server/otp";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-token";
import { loadUserCredits } from "@/lib/server/access-control";
import { toSessionUser } from "@/lib/server/session-user";
import {
  ADMIN_SESSION_EPOCH_KEY,
  hashRecoveryCode,
  ownerEmailFromEnv,
  OWNER_RECOVERY_HASH_KEY,
  recoveryCodesMatch,
} from "@/lib/owner-recovery";

const VERIFY_ATTEMPTS = { limit: 8, windowSeconds: 15 * 60 };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { recoveryCode?: string; code?: string }
    | null;
  const recoveryCode = body?.recoveryCode?.trim() ?? "";
  const code = normalizeOtpCode(body?.code ?? "");
  if (recoveryCode.length < 16 || code.length !== 6) {
    return NextResponse.json({ ok: false, message: "Thiếu mã khôi phục hoặc OTP." }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const ownerEmail = ownerEmailFromEnv(env);
  if (!ownerEmail) {
    return NextResponse.json(
      { ok: false, message: "Chưa cấu hình email chủ sở hữu." },
      { status: 500 }
    );
  }

  const attempts = await peekRateLimit(env.OTP_KV, "recover-verify", ownerEmail, VERIFY_ATTEMPTS);
  if (!attempts.allowed) {
    return tooManyRequests("Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.", attempts.retryAfterSeconds);
  }

  const db = drizzle(env.DB);
  const stored = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, OWNER_RECOVERY_HASH_KEY))
    .get();
  if (!stored?.value) {
    return NextResponse.json({ ok: false, message: "Chưa tạo mã khôi phục." }, { status: 400 });
  }

  const guess = await hashRecoveryCode(recoveryCode);
  if (!recoveryCodesMatch(stored.value, guess)) {
    await recordRateLimitHit(env.OTP_KV, "recover-verify", ownerEmail, VERIFY_ATTEMPTS);
    return NextResponse.json({ ok: false, message: "Mã khôi phục không đúng." }, { status: 401 });
  }

  if (!(await consumeOtp(db, ownerEmail, code))) {
    await recordRateLimitHit(env.OTP_KV, "recover-verify", ownerEmail, VERIFY_ATTEMPTS);
    return NextResponse.json(
      { ok: false, message: "Mã OTP không chính xác hoặc đã hết hạn." },
      { status: 401 }
    );
  }

  const epoch = Math.floor(Date.now() / 1000);
  await env.OTP_KV.put(ADMIN_SESSION_EPOCH_KEY, String(epoch));

  const now = new Date().toISOString();
  let user = (await db.select().from(users).where(eq(users.email, ownerEmail)).get()) ?? null;
  if (!user) {
    const namePart = ownerEmail.split("@")[0] || "Owner";
    user = {
      id: crypto.randomUUID(),
      email: ownerEmail,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      role: "ADMIN",
      avatar: null,
      countryCode: null,
      preferredLang: null,
      createdAt: now,
      lastLoginAt: now,
      paidCreditBalance: 0,
      paidCreditExpiresAt: null,
      giftCreditBalance: 0,
      giftCreditDate: null,
      giftGrantedThisMonth: 0,
      giftMonth: null,
    };
    await db.insert(users).values(user);
  } else {
    await db
      .update(users)
      .set({ role: "ADMIN", lastLoginAt: now })
      .where(eq(users.id, user.id));
    user = { ...user, role: "ADMIN", lastLoginAt: now };
  }

  const token = await signSession(
    { sub: user.id, email: user.email, role: "ADMIN" },
    env.JWT_SECRET
  );
  const credits = await loadUserCredits(db, user.id);
  const view = toSessionUser({ ...user, ...(credits ?? {}) });
  const res = NextResponse.json({ ok: true, user: view });
  res.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(env.SESSION_COOKIE_DOMAIN, request.headers.get("host"))
  );
  return res;
}
