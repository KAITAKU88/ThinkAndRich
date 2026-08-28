import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { marketPricing } from "@/db/schema";
import {
  CREDIT_PACKAGES,
  fallbackMarketPricing,
  formatPackagePrice,
  getMarket,
} from "@/lib/credit-packages";
import type { CountryCode, CreditPackageId, MarketPricing } from "@/lib/types";

export async function loadMarketPricing(
  db: DrizzleD1Database,
  country: CountryCode
): Promise<MarketPricing> {
  const fallback = fallbackMarketPricing(country);
  const rows = await db.select().from(marketPricing).where(eq(marketPricing.countryCode, country)).all();
  if (rows.length === 0) return fallback;

  const packages = { ...fallback.packages };
  for (const row of rows) {
    const id = row.packageId as CreditPackageId;
    if (!(id in packages)) continue;
    packages[id] = {
      price: row.computedPrice,
      formatted: formatPackagePrice(row.computedPrice, country),
    };
  }
  const meta = getMarket(country);
  return { ...fallback, ...meta, packages };
}

export async function loadAllMarketPricing(db: DrizzleD1Database): Promise<Record<CountryCode, MarketPricing>> {
  const countries: CountryCode[] = ["VN", "US", "EU", "JP", "KR", "TW", "CN", "DEFAULT"];
  const result = {} as Record<CountryCode, MarketPricing>;
  for (const country of countries) {
    result[country] = await loadMarketPricing(db, country);
  }
  return result;
}

export function seedMarketPricingRows(nowIso: string) {
  const countries: CountryCode[] = ["VN", "US", "EU", "JP", "KR", "TW", "CN", "DEFAULT"];
  return countries.flatMap((country) => {
    const market = fallbackMarketPricing(country);
    return CREDIT_PACKAGES.map((pack) => ({
      countryCode: country,
      packageId: pack.id,
      fxRatePerVnd: String(getMarket(country).fxVndPerUnit),
      pppMultiplier: String(getMarket(country).pppMultiplier),
      computedPrice: market.packages[pack.id].price,
      currency: market.currency,
      updatedAt: nowIso,
      updatedBy: "seed",
      source: "manual" as const,
    }));
  });
}
