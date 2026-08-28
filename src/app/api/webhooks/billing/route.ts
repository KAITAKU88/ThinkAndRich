import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import {
  isPaddlePaidEvent,
  timingSafeEqualString,
  verifyPaddleSignature,
  type PaddleWebhookPayload,
} from "@/lib/paddle";
import { extractOrderReference } from "@/lib/order-reference";
import { fulfillPaidOrder } from "@/lib/server/fulfill-order";
import { isCreditPackageId } from "@/lib/credit-packages";
import { readPaymentSettings } from "@/lib/server/settings";

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const gateway = request.nextUrl.searchParams.get("gateway") || "sepay";

  if (gateway === "paddle") {
    return handlePaddleWebhook(request, env);
  }
  if (gateway !== "sepay") {
    return NextResponse.json({ ok: false, message: "Cổng thanh toán không được hỗ trợ." }, { status: 400 });
  }

  const db = drizzle(env.DB);
  const settings = await readPaymentSettings(db);
  if (!settings.sepayWebhookSecret) {
    return NextResponse.json({ ok: false, message: "Webhook SePay chưa được cấu hình." }, { status: 503 });
  }

  const auth = request.headers.get("authorization") || "";
  const expected = `Apikey ${settings.sepayWebhookSecret}`;
  if (!timingSafeEqualString(auth, expected)) {
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

  const reference = extractOrderReference(body.transactionContent);
  if (!reference) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản." }, { status: 400 });
  }

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
  if (!isCreditPackageId(order.packageId)) {
    return NextResponse.json({ ok: false, message: "Gói credit trên đơn hàng không hợp lệ." }, { status: 400 });
  }

  const now = new Date();
  await db
    .update(orders)
    .set({ status: "PAID", paidAt: now.toISOString(), rawPayload: JSON.stringify(body) })
    .where(eq(orders.id, order.id));
  const paidOrder = await db.select().from(orders).where(eq(orders.id, order.id)).get();
  if (paidOrder) await fulfillPaidOrder(db, env, paidOrder, now);

  return NextResponse.json({ ok: true, gateway: "sepay", message: "Đã xác nhận thanh toán và cộng credit." });
}

async function handlePaddleWebhook(request: NextRequest, env: CloudflareEnv) {
  const db = drizzle(env.DB);
  const settings = await readPaymentSettings(db);
  if (!settings.paddleWebhookSecret) {
    return NextResponse.json({ ok: false, message: "Webhook Paddle chưa được cấu hình." }, { status: 503 });
  }

  const rawBody = await request.text();
  const valid = await verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"), settings.paddleWebhookSecret);
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as PaddleWebhookPayload;
  const orderId = payload.data?.custom_data?.order_id;
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Thiếu order_id trong custom_data." }, { status: 400 });
  }

  if (!isPaddlePaidEvent(payload)) {
    return NextResponse.json({ ok: true, message: "Sự kiện đã ghi nhận, không cần xử lý." });
  }

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) {
    return NextResponse.json({ ok: false, message: "Đơn hàng không tồn tại." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ ok: true, message: "Đơn hàng đã được xử lý trước đó." });
  }
  if (!isCreditPackageId(order.packageId)) {
    return NextResponse.json({ ok: false, message: "Gói credit trên đơn hàng không hợp lệ." }, { status: 400 });
  }

  const now = new Date();
  await db.update(orders).set({ status: "PAID", paidAt: now.toISOString(), rawPayload: rawBody }).where(eq(orders.id, orderId));
  const paidOrder = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (paidOrder) await fulfillPaidOrder(db, env, paidOrder, now);

  return NextResponse.json({ ok: true, gateway: "paddle", message: "Đã xác nhận thanh toán và cộng credit." });
}
