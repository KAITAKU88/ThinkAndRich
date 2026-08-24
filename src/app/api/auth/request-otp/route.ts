import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const OTP_TTL_SECONDS = 5 * 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Email không hợp lệ." }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await env.OTP_KV.put(email, code, { expirationTtl: OTP_TTL_SECONDS });

  await env.EMAIL.send({
    to: email,
    from: { email: "otp@ankiva.cc", name: "Think & Rich" },
    subject: `${code} là mã xác thực đăng nhập Think & Rich của bạn`,
    text: `Mã xác thực của bạn là: ${code}\n\nMã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
    html: `<p>Mã xác thực của bạn là: <strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
  });

  return NextResponse.json({ ok: true });
}
