import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { appSettings } from "@/db/schema";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/server/rate-limit";
import { sendAuthOtp } from "@/lib/server/send-otp";
import {
  hashRecoveryCode,
  ownerEmailFromEnv,
  OWNER_RECOVERY_HASH_KEY,
  recoveryCodesMatch,
} from "@/lib/owner-recovery";

const PER_IP = { limit: 8, windowSeconds: 60 * 60 };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { recoveryCode?: string } | null;
  const recoveryCode = body?.recoveryCode?.trim() ?? "";
  if (recoveryCode.length < 16) {
    return NextResponse.json({ ok: false, message: "Mã khôi phục không đúng." }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const byIp = await checkRateLimit(env.OTP_KV, "recover-start", clientIp(request), PER_IP);
  if (!byIp.allowed) {
    return tooManyRequests("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.", byIp.retryAfterSeconds);
  }

  const ownerEmail = ownerEmailFromEnv(env);
  if (!ownerEmail) {
    return NextResponse.json(
      { ok: false, message: "Chưa cấu hình email chủ sở hữu." },
      { status: 500 }
    );
  }

  const db = drizzle(env.DB);
  const stored = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, OWNER_RECOVERY_HASH_KEY))
    .get();
  if (!stored?.value) {
    return NextResponse.json(
      { ok: false, message: "Chưa tạo mã khôi phục. Đăng nhập admin rồi vào Cấu hình để tạo mã." },
      { status: 400 }
    );
  }

  const guess = await hashRecoveryCode(recoveryCode);
  if (!recoveryCodesMatch(stored.value, guess)) {
    return NextResponse.json({ ok: false, message: "Mã khôi phục không đúng." }, { status: 401 });
  }

  await sendAuthOtp(env, ownerEmail, "khôi phục tài khoản quản trị");
  return NextResponse.json({ ok: true });
}
