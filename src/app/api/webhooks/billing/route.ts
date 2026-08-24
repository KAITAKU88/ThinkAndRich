import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { orders, users } from "@/db/schema";

// SePay-only for now (see checkout route + migration plan — Lemon Squeezy
// needs a real checkout-session API integration this repo doesn't have).
// SePay's webhook carries a shared-secret `Authorization` header; without
// checking it, anyone who finds this URL could forge a "payment received"
// call and upgrade any account's tier for free.
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const gateway = request.nextUrl.searchParams.get("gateway") || "sepay";

  if (gateway !== "sepay") {
    return NextResponse.json({ ok: false, message: "Chỉ hỗ trợ SePay ở thời điểm hiện tại." }, { status: 400 });
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

  // The internal order id was embedded in the VietQR `addInfo` string at
  // checkout-creation time (src/components/checkout/CheckoutPage.tsx), so
  // it comes back in `transactionContent` for reconciliation.
  const content = body.transactionContent || "";
  const match = content.match(/ord_[a-zA-Z0-9-]+/);
  const orderId = match?.[0];
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản." }, { status: 400 });
  }

  const db = drizzle(env.DB);
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
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
      .where(eq(orders.id, orderId)),
    db.update(users).set({ tier: order.tier }).where(eq(users.id, order.userId)),
  ]);

  return NextResponse.json({ ok: true, gateway: "sepay", message: "Đã xác nhận thanh toán và nâng cấp gói." });
}
