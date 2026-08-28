import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { getPppPricing } from "@/lib/geo-pricing";
import { createPaddleCheckout } from "@/lib/paddle";
import { generateOrderReference } from "@/lib/order-reference";
import { isCreditPackageId, packageById } from "@/lib/credit-packages";
import { loadMarketPricing } from "@/lib/server/market-pricing";
import { validatePromotion } from "@/lib/server/promotions";
import { readPaymentSettings } from "@/lib/server/settings";
import { isPaddleConfigured, paddlePriceIdForPackage } from "@/lib/payment-settings";
import type { CountryCode } from "@/lib/types";

export async function POST(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập trước khi thanh toán." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { packageId?: string; promoCode?: string } | null;
  if (!isCreditPackageId(body?.packageId)) {
    return NextResponse.json({ ok: false, message: "Gói credit không hợp lệ." }, { status: 400 });
  }

  const countryCode = (request.nextUrl.searchParams.get("country") as CountryCode) || "VN";
  const db = drizzle(ctx.env.DB);
  const market = (await loadMarketPricing(db, countryCode)) ?? getPppPricing(countryCode);
  const pack = packageById(body.packageId);
  const listAmount = market.packages[body.packageId].price;
  let amount = listAmount;
  let promotionId: string | null = null;
  let discountAmount = 0;

  if (body.promoCode?.trim()) {
    const promo = await validatePromotion(db, body.promoCode, body.packageId, listAmount);
    if (!promo.ok) {
      return NextResponse.json({ ok: false, message: promo.message }, { status: 400 });
    }
    amount = promo.result.finalAmount;
    promotionId = promo.result.promotion.id;
    discountAmount = promo.result.discountAmount;
  }

  const id = `ord_${crypto.randomUUID()}`;
  const reference = generateOrderReference();
  const now = new Date().toISOString();

  if (market.gateway === "sepay") {
    await db.insert(orders).values({
      id,
      userId: ctx.session.sub,
      gateway: "sepay",
      packageId: body.packageId,
      amount,
      currency: market.currency,
      status: "PENDING",
      gatewayReference: reference,
      promotionId,
      discountAmount,
      rawPayload: null,
      createdAt: now,
      paidAt: null,
    });

    return NextResponse.json({
      ok: true,
      orderId: id,
      reference,
      amount,
      currency: market.currency,
      credits: pack.credits,
      packageId: body.packageId,
    });
  }

  const settings = await readPaymentSettings(db);
  const priceId = paddlePriceIdForPackage(settings, body.packageId);
  if (!isPaddleConfigured(settings) || !priceId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Cổng thanh toán quốc tế (Paddle) chưa được cấu hình — vào Cấu hình thanh toán để nhập thông số.",
      },
      { status: 503 }
    );
  }

  const checkout = await createPaddleCheckout({
    apiKey: settings.paddleApiKey,
    sandbox: settings.paddleSandbox,
    priceId,
    orderId: id,
  });
  if ("error" in checkout) {
    return NextResponse.json({ ok: false, message: checkout.error }, { status: 502 });
  }

  await db.insert(orders).values({
    id,
    userId: ctx.session.sub,
    gateway: "paddle",
    packageId: body.packageId,
    amount,
    currency: market.currency,
    status: "PENDING",
    gatewayReference: reference,
    promotionId,
    discountAmount,
    rawPayload: null,
    createdAt: now,
    paidAt: null,
  });

  return NextResponse.json({
    ok: true,
    orderId: id,
    reference,
    amount,
    currency: market.currency,
    credits: pack.credits,
    packageId: body.packageId,
    checkoutUrl: checkout.url,
    discountAmount,
  });
}
