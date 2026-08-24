import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { getPppPricing } from "@/lib/geo-pricing";
import { createLemonSqueezyCheckout } from "@/lib/lemonsqueezy";
import type { CountryCode, MembershipTier } from "@/lib/types";

// Creates a PENDING order with server-computed amount/currency — never
// trust a client-submitted price. SePay (VN, VietQR bank transfer) gets a
// real order lifecycle immediately; Lemon Squeezy (international) creates
// the order the same way and also opens a real hosted checkout session via
// their API — the actual charge amount is whatever the configured variant
// charges in the LS dashboard, not the client- or PPP-derived `amount`
// below (that value is stored only as a display estimate).
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
  const amount = ppp.plans[body.tier].price;
  const db = drizzle(ctx.env.DB);
  const id = `ord_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  if (ppp.gateway === "sepay") {
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

  // Lemon Squeezy branch
  const { LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_VARIANT_PLUS, LEMONSQUEEZY_VARIANT_PRO } = ctx.env;
  const variantId = body.tier === "PRO" ? LEMONSQUEEZY_VARIANT_PRO : LEMONSQUEEZY_VARIANT_PLUS;
  if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID || !variantId) {
    return NextResponse.json(
      { ok: false, message: "Cổng thanh toán quốc tế (Lemon Squeezy) chưa được cấu hình — vui lòng thử lại sau." },
      { status: 503 }
    );
  }

  const checkout = await createLemonSqueezyCheckout({
    apiKey: LEMONSQUEEZY_API_KEY,
    storeId: LEMONSQUEEZY_STORE_ID,
    variantId,
    email: ctx.session.email,
    orderId: id,
    redirectUrl: `${request.nextUrl.origin}/checkout?plan=${body.tier}`,
  });
  if ("error" in checkout) {
    return NextResponse.json({ ok: false, message: checkout.error }, { status: 502 });
  }

  await db.insert(orders).values({
    id,
    userId: ctx.session.sub,
    gateway: "lemonsqueezy",
    tier: body.tier,
    amount,
    currency: ppp.currency,
    status: "PENDING",
    gatewayReference: id,
    rawPayload: null,
    createdAt: now,
    paidAt: null,
  });

  return NextResponse.json({ ok: true, orderId: id, amount, currency: ppp.currency, checkoutUrl: checkout.url });
}
