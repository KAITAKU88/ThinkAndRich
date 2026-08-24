import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { getPppPricing } from "@/lib/geo-pricing";
import type { CountryCode, MembershipTier } from "@/lib/types";

// Creates a PENDING order with server-computed amount/currency — never
// trust a client-submitted price. Only SePay (VN, VietQR bank transfer) is
// wired to a real order lifecycle for now; Lemon Squeezy needs a real
// checkout-session API call this repo doesn't have yet, so it's rejected
// here rather than pretending to collect a real card charge.
export async function POST(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập trước khi thanh toán." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tier?: MembershipTier } | null;
  if (body?.tier !== "PLUS" && body?.tier !== "PRO") {
    return NextResponse.json({ ok: false, message: "Gói hội viên không hợp lệ." }, { status: 400 });
  }

  const countryCode = (request.nextUrl.searchParams.get("country") as CountryCode) || "VN";
  const ppp = getPppPricing(countryCode);

  if (ppp.gateway !== "sepay") {
    return NextResponse.json(
      { ok: false, message: "Cổng thanh toán quốc tế (Lemon Squeezy) chưa khả dụng — vui lòng thử lại sau." },
      { status: 400 }
    );
  }

  const amount = ppp.plans[body.tier].price;
  const db = drizzle(ctx.env.DB);
  const id = `ord_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await db.insert(orders).values({
    id,
    userId: ctx.session.sub,
    gateway: "sepay",
    tier: body.tier,
    amount,
    currency: ppp.currency,
    status: "PENDING",
    gatewayReference: id,
    rawPayload: null,
    createdAt: now,
    paidAt: null,
  });

  return NextResponse.json({ ok: true, orderId: id, amount, currency: ppp.currency });
}
