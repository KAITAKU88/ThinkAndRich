import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { requireSession } from "@/lib/api-auth";
import { isCreditPackageId, packageById } from "@/lib/credit-packages";
import { getPppPricing } from "@/lib/geo-pricing";
import { loadMarketPricing } from "@/lib/server/market-pricing";
import { validatePromotion } from "@/lib/server/promotions";
import type { CountryCode, CreditPackageId } from "@/lib/types";

export async function POST(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    code?: string;
    packageId?: string;
    country?: CountryCode;
  } | null;

  if (!isCreditPackageId(body?.packageId)) {
    return NextResponse.json({ ok: false, message: "Gói credit không hợp lệ." }, { status: 400 });
  }
  const code = body?.code?.trim();
  if (!code) {
    return NextResponse.json({ ok: false, message: "Nhập mã giảm giá." }, { status: 400 });
  }

  const countryCode = body?.country || "VN";
  const db = drizzle(ctx.env.DB);
  const market = (await loadMarketPricing(db, countryCode)) ?? getPppPricing(countryCode);
  const packageId = body.packageId as CreditPackageId;
  const listAmount = market.packages[packageId].price;

  const result = await validatePromotion(db, code, packageId, listAmount);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  const pack = packageById(packageId);
  return NextResponse.json({
    ok: true,
    promotion: {
      id: result.result.promotion.id,
      code: result.result.promotion.code,
      name: result.result.promotion.name,
    },
    listAmount,
    discountAmount: result.result.discountAmount,
    finalAmount: result.result.finalAmount,
    currency: market.currency,
    credits: pack.credits,
  });
}
