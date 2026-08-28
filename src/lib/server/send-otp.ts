import { drizzle } from "drizzle-orm/d1";
import { OTP_TTL_MINUTES } from "@/lib/otp-policy";
import { randomOtpCode, storeOtp } from "@/lib/server/otp";

export interface SendOtpResult {
  code: string;
  emailed: boolean;
}

/**
 * Local `next dev` cannot deliver mail: Cloudflare's send_email binding has
 * no local sender (the remote proxy hangs). The code is stored in D1;
 * callers on loopback echo it to the operator. Production always emails
 * and never returns the code.
 */
export function shouldSkipOtpEmail(opts: {
  nodeEnv?: string;
  hostname?: string | null;
}): boolean {
  if (opts.nodeEnv === "development") return true;
  const host = opts.hostname?.split(":")[0]?.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

export async function sendAuthOtp(
  env: CloudflareEnv,
  email: string,
  subjectPrefix = "đăng nhập",
  skipEmail = false
): Promise<SendOtpResult> {
  const code = randomOtpCode();
  // Persist first, then email. KV used to hold the code: it is eventually
  // consistent, and a 1.5s local-dev timeout used to swallow a slow put
  // then still send the mail — both produced "OTP hết hạn hoặc không chính xác"
  // on production. D1 commits before this returns.
  await storeOtp(drizzle(env.DB), email, code);

  if (skipEmail) {
    return { code, emailed: false };
  }

  await env.EMAIL.send({
    to: email,
    from: { email: "otp@ankiva.cc", name: "Think & Rich" },
    subject: `${code} là mã xác thực ${subjectPrefix} Think & Rich của bạn`,
    text: `Mã xác thực của bạn là: ${code}\n\nMã có hiệu lực trong ${OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
    html: `<p>Mã xác thực của bạn là: <strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>Mã có hiệu lực trong ${OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
  });
  return { code, emailed: true };
}
