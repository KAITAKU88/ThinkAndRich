import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { isCreditPackageId, packageById } from "@/lib/credit-packages";
import { fulfillPaidOrder } from "@/lib/server/fulfill-order";
import { generateOrderReference } from "@/lib/order-reference";
import type { CreditPackageId } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const body = (await request.json().catch(() => null)) as { packageId?: string } | null;
  if (!isCreditPackageId(body?.packageId)) {
    return NextResponse.json({ ok: false, message: "Chọn một trong 3 gói credit hợp lệ." }, { status: 400 });
  }

  const db = drizzle(ctx.env.DB);
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.role === "ADMIN") {
    return NextResponse.json({ ok: false, message: "Không tìm thấy độc giả." }, { status: 404 });
  }

  const packageId = body.packageId as CreditPackageId;
  const pack = packageById(packageId);
  const now = new Date();
  const orderId = `ord_${crypto.randomUUID()}`;
  const reference = generateOrderReference();

  await db.insert(orders).values({
    id: orderId,
    userId,
    gateway: "admin",
    packageId,
    amount: 0,
    currency: "VND",
    status: "PAID",
    gatewayReference: reference,
    promotionId: null,
    discountAmount: pack.vndPrice,
    rawPayload: JSON.stringify({
      type: "admin_grant",
      grantedBy: ctx.session.sub,
      note: "100% promotion equivalent",
    }),
    createdAt: now.toISOString(),
    paidAt: now.toISOString(),
  });

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) {
    return NextResponse.json({ ok: false, message: "Không tạo được đơn hàng." }, { status: 500 });
  }

  await fulfillPaidOrder(db, ctx.env, order, now);

  return NextResponse.json({
    ok: true,
    message: `Đã cấp ${pack.credits.toLocaleString("vi-VN")} credit và gửi email thông báo.`,
    orderId,
    packageId,
    credits: pack.credits,
  });
}
