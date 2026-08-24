import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";

// Self-scoped order status — CheckoutPage polls this instead of the
// client self-declaring success, since a SePay bank transfer isn't
// instant and only the webhook (src/app/api/webhooks/billing/route.ts)
// actually knows when it's been paid.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const order = await db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order || order.userId !== ctx.session.sub) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
