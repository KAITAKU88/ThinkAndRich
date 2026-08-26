import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/server/rate-limit";
import { OTP_TTL_MINUTES, OTP_TTL_SECONDS, otpKey } from "@/lib/server/otp";

// This endpoint mails a code to whatever address it is handed, so without a
// limit it is both a spam relay pointed at strangers and a way to exhaust the
// account's Cloudflare email quota. Two counters: per address, so one mailbox
// can't be flooded, and per IP, so one caller can't work through many.
const PER_EMAIL = { limit: 4, windowSeconds: 15 * 60 };
const PER_IP = { limit: 15, windowSeconds: 60 * 60 };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Email không hợp lệ." }, { status: 400 });
  }

  const { env } = getCloudflareContext();

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

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await env.OTP_KV.put(otpKey(email, code), "1", { expirationTtl: OTP_TTL_SECONDS });

  await env.EMAIL.send({
    to: email,
    from: { email: "otp@ankiva.cc", name: "Think & Rich" },
    subject: `${code} là mã xác thực đăng nhập Think & Rich của bạn`,
    text: `Mã xác thực của bạn là: ${code}\n\nMã có hiệu lực trong ${OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
    html: `<p>Mã xác thực của bạn là: <strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>Mã có hiệu lực trong ${OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
  });

  return NextResponse.json({ ok: true });
}
