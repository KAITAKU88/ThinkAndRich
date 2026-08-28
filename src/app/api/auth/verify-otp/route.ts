import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-token";
import { peekRateLimit, recordRateLimitHit, tooManyRequests } from "@/lib/server/rate-limit";
import { otpKey } from "@/lib/server/otp";
import { loadUserCredits } from "@/lib/server/access-control";
import { toSessionUser } from "@/lib/server/session-user";

const VERIFY_ATTEMPTS = { limit: 8, windowSeconds: 15 * 60 };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; code?: string }
    | null;
  const email = body?.email?.trim().toLowerCase();
  const code = body?.code?.trim();
  if (!email || !code) {
    return NextResponse.json({ ok: false, message: "Thiếu email hoặc mã OTP." }, { status: 400 });
  }

  const { env } = getCloudflareContext();

  // The code is six digits and stays valid for its full five minutes even
  // after a wrong guess, so unlimited attempts would make it brute-forceable.
  // Only failures are counted — a legitimate login costs no KV write.
  const attempts = await peekRateLimit(env.OTP_KV, "otp-verify", email, VERIFY_ATTEMPTS);
  if (!attempts.allowed) {
    return tooManyRequests("Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.", attempts.retryAfterSeconds);
  }

  // The code is looked up as part of the key, so any code still within its
  // five minutes is accepted — including one issued before the user pressed
  // "resend". Presence is the whole check; the value is a placeholder.
  const key = otpKey(email, code);
  if ((await env.OTP_KV.get(key)) === null) {
    await recordRateLimitHit(env.OTP_KV, "otp-verify", email, VERIFY_ATTEMPTS);
    return NextResponse.json(
      { ok: false, message: "Mã OTP không chính xác hoặc đã hết hạn." },
      { status: 401 }
    );
  }
  await env.OTP_KV.delete(key); // one-time use

  const db = drizzle(env.DB);
  const now = new Date().toISOString();

  // Admin rights come from an explicit allowlist held in the Worker's
  // secrets, never from the address itself. This previously read
  // `email.includes("admin")`, which handed ADMIN + PRO to anyone on first
  // login from any address containing that substring — admin@gmail.com,
  // myadmin@…, even badmin@… — i.e. to anybody who wanted it.
  const adminEmails = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const isAllowlistedAdmin = adminEmails.includes(email);

  let user = (await db.select().from(users).where(eq(users.email, email)).get()) ?? null;
  if (!user) {
    const namePart = email.split("@")[0] || "Độc giả";
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    user = {
      id: crypto.randomUUID(),
      email,
      name,
      role: isAllowlistedAdmin ? "ADMIN" : "USER",
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
  } else if (isAllowlistedAdmin && user.role !== "ADMIN") {
    // Lets the owner grant themselves access by editing the allowlist, even
    // though their account already exists as a plain reader. Only ever
    // promotes: demotion stays a deliberate action in the admin console, so a
    // mistyped allowlist cannot lock everyone out.
    user = { ...user, role: "ADMIN" };
    await db.update(users).set({ role: "ADMIN", lastLoginAt: now }).where(eq(users.id, user.id));
  } else {
    await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));
  }

  const token = await signSession(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET
  );

  const credits = await loadUserCredits(db, user.id);
  const view = toSessionUser({ ...user, ...(credits ?? {}) });
  const res = NextResponse.json({ ok: true, user: view });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(env.SESSION_COOKIE_DOMAIN, request.headers.get("host")));
  return res;
}
