import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";
import { loadUserCredits } from "@/lib/server/access-control";
import { toSessionUser } from "@/lib/server/session-user";
import { ADMIN_SESSION_EPOCH_KEY, isAdminSessionStale } from "@/lib/owner-recovery";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const { env } = getCloudflareContext();
  const session = await verifySession(token, env.JWT_SECRET);
  if (!session) {
    return NextResponse.json({ ok: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }
  if (session.role === "ADMIN") {
    try {
      const epoch = Number((await env.OTP_KV.get(ADMIN_SESSION_EPOCH_KEY)) ?? 0) || 0;
      if (isAdminSessionStale(session.iat, epoch)) {
        return NextResponse.json({ ok: false, message: "Phiên đăng nhập đã bị thu hồi." }, { status: 401 });
      }
    } catch {
      // fail open
    }
  }

  const db = drizzle(env.DB);
  const user = await db.select().from(users).where(eq(users.id, session.sub)).get();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản." }, { status: 401 });
  }

  const credits = await loadUserCredits(db, user.id);
  const view = toSessionUser({ ...user, ...(credits ?? {}) });
  return NextResponse.json({ ok: true, user: view });
}
