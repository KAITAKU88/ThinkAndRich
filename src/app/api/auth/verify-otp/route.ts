import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session-token";

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

  const storedCode = await env.OTP_KV.get(email);
  if (!storedCode || storedCode !== code) {
    return NextResponse.json(
      { ok: false, message: "Mã OTP không chính xác hoặc đã hết hạn." },
      { status: 401 }
    );
  }
  await env.OTP_KV.delete(email); // one-time use

  const db = drizzle(env.DB);
  const isAdmin = email.includes("admin") || email === "admin@thinkandrich.com";
  const now = new Date().toISOString();

  let user = (await db.select().from(users).where(eq(users.email, email)).get()) ?? null;
  if (!user) {
    const namePart = email.split("@")[0] || "Độc giả";
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    user = {
      id: crypto.randomUUID(),
      email,
      name,
      role: isAdmin ? "ADMIN" : "USER",
      tier: isAdmin ? "PRO" : "FREE",
      avatar: null,
      countryCode: null,
      preferredLang: null,
      createdAt: now,
      lastLoginAt: now,
      dailyReadsDate: null,
      dailyReadsCount: 0,
    };
    await db.insert(users).values(user);
  } else {
    await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));
  }

  const token = await signSession(
    { sub: user.id, email: user.email, role: user.role, tier: user.tier },
    env.JWT_SECRET
  );

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
