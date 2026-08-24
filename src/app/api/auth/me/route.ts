import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";

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

  const db = drizzle(env.DB);
  const user = await db.select().from(users).where(eq(users.id, session.sub)).get();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
