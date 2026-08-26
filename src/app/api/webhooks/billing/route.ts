import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { orders, users } from "@/db/schema";
import { verifyLemonSqueezySignature, type LemonSqueezyWebhookPayload } from "@/lib/lemonsqueezy";
import { UPGRADE_TERM_DAYS } from "@/lib/upgrade-pricing";
import { extractOrderReference } from "@/lib/order-reference";

// Every settled order starts a fresh one-year term at the moment it settles.
// That is the same rule for a first purchase and for a mid-term upgrade: the
// upgrade cancels what was left of PLUS by pricing it into the top-up (see
// src/lib/upgrade-pricing.ts), so what follows is a full new PRO year rather
// than the remainder of the old one.
//
// planExpiresAt is recorded but not yet enforced — access still follows
// `tier` alone. See the note on the column in src/db/schema.ts.
function grantedTerm(paidAt: string) {
  return {
    planStartedAt: paidAt,
    planExpiresAt: new Date(new Date(paidAt).getTime() + UPGRADE_TERM_DAYS * 86_400_000).toISOString(),
  };
}

// Both gateways carry a shared-secret proof (SePay: `Authorization` header,
// Lemon Squeezy: HMAC-SHA256 `X-Signature` over the raw body) — without
// checking it, anyone who finds this URL could forge a "payment received"
// call and upgrade any account's tier for free.
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const gateway = request.nextUrl.searchParams.get("gateway") || "sepay";

  if (gateway === "lemonsqueezy") {
    return handleLemonSqueezyWebhook(request, env);
  }
  if (gateway !== "sepay") {
    return NextResponse.json({ ok: false, message: "Cổng thanh toán không được hỗ trợ." }, { status: 400 });
  }

  const auth = request.headers.get("authorization") || "";
  const expected = `Apikey ${env.SEPAY_WEBHOOK_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    transactionDate?: string;
    accountNumber?: string;
    amountIn?: number;
    transactionContent?: string;
    referenceCode?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ ok: false, message: "Payload không hợp lệ." }, { status: 400 });
  }

  // The order's transfer reference was embedded in the VietQR `addInfo`
  // string at checkout time, so it comes back in `transactionContent`. It is
  // read rather than matched exactly: a bank rewrites that field on its way
  // through — inserting spaces, dropping punctuation, wrapping it in
  // narration of its own — and the reader in src/lib/order-reference.ts is
  // built to survive that. It replaced a raw `ord_<uuid>` match that depended
  // on an underscore arriving intact, where a failure meant the money landed
  // and the order sat PENDING with nothing linking the two.
  const reference = extractOrderReference(body.transactionContent);
  if (!reference) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản." }, { status: 400 });
  }

  const db = drizzle(env.DB);
  const order = await db.select().from(orders).where(eq(orders.gatewayReference, reference)).get();
  if (!order) {
    return NextResponse.json({ ok: false, message: "Đơn hàng không tồn tại." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ ok: true, message: "Đơn hàng đã được xử lý trước đó." });
  }
  if (typeof body.amountIn === "number" && body.amountIn < order.amount) {
    return NextResponse.json({ ok: false, message: "Số tiền chuyển khoản không khớp." }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db.batch([
    db
      .update(orders)
      .set({ status: "PAID", paidAt: now, rawPayload: JSON.stringify(body) })
      .where(eq(orders.id, order.id)),
    db
      .update(users)
      .set({ tier: order.tier, ...grantedTerm(now) })
      .where(eq(users.id, order.userId)),
  ]);

  return NextResponse.json({ ok: true, gateway: "sepay", message: "Đã xác nhận thanh toán và nâng cấp gói." });
}

// Lemon Squeezy fires this for every order/subscription event; we only act
// on `order_created` with status "paid" and otherwise 200 it so LS doesn't
// retry-storm us for events we intentionally ignore. Signature must be
// checked over the raw body before any JSON.parse.
async function handleLemonSqueezyWebhook(request: NextRequest, env: CloudflareEnv) {
  const rawBody = await request.text();
  const valid = await verifyLemonSqueezySignature(
    rawBody,
    request.headers.get("x-signature"),
    env.LEMONSQUEEZY_WEBHOOK_SECRET
  );
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  const orderId = payload.meta?.custom_data?.order_id;
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Thiếu order_id trong custom_data." }, { status: 400 });
  }

  if (payload.meta?.event_name !== "order_created" || payload.data?.attributes?.status !== "paid") {
    return NextResponse.json({ ok: true, message: "Sự kiện đã ghi nhận, không cần xử lý." });
  }

  const db = drizzle(env.DB);
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) {
    return NextResponse.json({ ok: false, message: "Đơn hàng không tồn tại." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ ok: true, message: "Đơn hàng đã được xử lý trước đó." });
  }

  const now = new Date().toISOString();
  await db.batch([
    db.update(orders).set({ status: "PAID", paidAt: now, rawPayload: rawBody }).where(eq(orders.id, orderId)),
    db
      .update(users)
      .set({ tier: order.tier, ...grantedTerm(now) })
      .where(eq(users.id, order.userId)),
  ]);

  return NextResponse.json({ ok: true, gateway: "lemonsqueezy", message: "Đã xác nhận thanh toán và nâng cấp gói." });
}
