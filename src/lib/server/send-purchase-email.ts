import type { CreditPackageId } from "@/lib/types";
import { GIFT_DAILY_GRANT, PAID_TERM_DAYS } from "@/lib/credits";
import { packageById } from "@/lib/credit-packages";
import { shouldSkipOtpEmail } from "@/lib/server/send-otp";

export interface PurchaseEmailContext {
  userName: string;
  userEmail: string;
  packageId: CreditPackageId;
  creditsGranted: number;
  source?: "purchase" | "admin_grant";
}

export async function sendPurchaseWelcomeEmail(
  env: CloudflareEnv,
  ctx: PurchaseEmailContext,
  skipEmail = shouldSkipOtpEmail({
    nodeEnv: process.env.NODE_ENV,
    hostname: null,
  })
): Promise<{ emailed: boolean }> {
  const pack = packageById(ctx.packageId);
  const credits = ctx.creditsGranted || pack.credits;
  const greeting = ctx.userName?.trim() || "bạn";

  const subject =
    ctx.source === "admin_grant"
      ? `Think & Rich — Bạn đã nhận ${credits.toLocaleString("vi-VN")} credit`
      : `Think & Rich — Cảm ơn bạn đã mua ${credits.toLocaleString("vi-VN")} credit`;

  const text = [
    `Xin chào ${greeting},`,
    "",
    ctx.source === "admin_grant"
      ? `Tài khoản của bạn vừa được cộng ${credits.toLocaleString("vi-VN")} credit.`
      : `Thanh toán thành công! Bạn vừa nhận ${credits.toLocaleString("vi-VN")} credit vào ví.`,
    "",
    "Hướng dẫn sử dụng credit:",
    `• Mỗi ngày bạn còn nhận thêm ${GIFT_DAILY_GRANT} credit miễn phí (không cộng dồn).`,
    "• Bài Open (0 credit) đọc ngay không tốn credit.",
    "• Bài tốn credit: mở khóa một lần, đọc vĩnh viễn — kể cả khi credit hết hạn.",
    `• Credit mua có hạn ${PAID_TERM_DAYS} ngày kể từ lần mua gần nhất; mỗi lần mua mới sẽ gia hạn toàn bộ số dư paid.`,
    "",
    "Khám phá thư viện: https://thinkandrich.ankiva.cc/explore",
    "",
    "Chúc bạn đọc hiệu quả,",
    "Think & Rich",
  ].join("\n");

  const html = `
    <p>Xin chào <strong>${escapeHtml(greeting)}</strong>,</p>
    <p>${
      ctx.source === "admin_grant"
        ? `Tài khoản của bạn vừa được cộng <strong>${credits.toLocaleString("vi-VN")} credit</strong>.`
        : `Thanh toán thành công! Bạn vừa nhận <strong>${credits.toLocaleString("vi-VN")} credit</strong> vào ví.`
    }</p>
    <h3 style="margin:1.25em 0 0.5em;font-size:16px">Hướng dẫn sử dụng credit</h3>
    <ul style="padding-left:1.2em;line-height:1.6">
      <li>Mỗi ngày bạn còn nhận thêm <strong>${GIFT_DAILY_GRANT} credit miễn phí</strong> (không cộng dồn).</li>
      <li>Bài <strong>Open</strong> (0 credit) đọc ngay không tốn credit.</li>
      <li>Bài tốn credit: <strong>mở khóa một lần, đọc vĩnh viễn</strong> — kể cả khi credit hết hạn.</li>
      <li>Credit mua có hạn <strong>${PAID_TERM_DAYS} ngày</strong> kể từ lần mua gần nhất; mỗi lần mua mới gia hạn toàn bộ số dư paid.</li>
    </ul>
    <p><a href="https://thinkandrich.ankiva.cc/explore">Khám phá thư viện →</a></p>
    <p style="margin-top:1.5em;color:#666;font-size:13px">Chúc bạn đọc hiệu quả,<br/>Think & Rich</p>
  `;

  if (skipEmail) {
    console.info("[purchase-email]", ctx.userEmail, subject);
    return { emailed: false };
  }

  await env.EMAIL.send({
    to: ctx.userEmail,
    from: { email: "otp@ankiva.cc", name: "Think & Rich" },
    subject,
    text,
    html,
  });

  return { emailed: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
