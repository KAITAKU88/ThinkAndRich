import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/server/rate-limit";
import { sendAuthOtp, shouldSkipOtpEmail } from "@/lib/server/send-otp";

const PER_EMAIL = { limit: 4, windowSeconds: 15 * 60 };
const PER_IP = { limit: 15, windowSeconds: 60 * 60 };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Email không hợp lệ." }, { status: 400 });
  }

  const skipEmail = shouldSkipOtpEmail({
    nodeEnv: process.env.NODE_ENV,
    hostname: request.headers.get("host") ?? request.nextUrl.hostname,
  });

  const { env } = getCloudflareContext();

  if (!skipEmail) {
    const byIp = await checkRateLimit(env.OTP_KV, "otp-ip", clientIp(request), PER_IP);
    if (!byIp.allowed) {
      return tooManyRequests("Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.", byIp.retryAfterSeconds);
    }
    const byEmail = await checkRateLimit(env.OTP_KV, "otp-email", email, PER_EMAIL);
    if (!byEmail.allowed) {
      return tooManyRequests(
        "Email này đã được gửi quá nhiều mã. Vui lòng thử lại sau ít phút.",
        byEmail.retryAfterSeconds
      );
    }
  }

  let issued: { code: string; emailed: boolean };
  try {
    issued = await sendAuthOtp(env, email, "đăng nhập", skipEmail);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Không lưu được mã OTP. Thử lại sau giây lát." },
      { status: 503 }
    );
  }

  if (!issued.emailed) {
    return NextResponse.json({ ok: true, devCode: issued.code });
  }

  return NextResponse.json({ ok: true });
}
