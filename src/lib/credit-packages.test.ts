import { describe, expect, it } from "vitest";
import {
  computePackagePrice,
  CREDIT_PACKAGES,
  fallbackMarketPricing,
  SEEDED_PACKAGE_PRICES,
  isCreditPackageId,
} from "./credit-packages";
import type { CountryCode } from "./types";

describe("fallbackMarketPricing", () => {
  const markets = Object.keys(SEEDED_PACKAGE_PRICES) as CountryCode[];

  it.each(markets)("serves the documented list price for %s", (country) => {
    const market = fallbackMarketPricing(country);
    for (const pack of CREDIT_PACKAGES) {
      expect(market.packages[pack.id].price).toBe(SEEDED_PACKAGE_PRICES[country][pack.id].price);
    }
  });
});

describe("computePackagePrice", () => {
  const markets = Object.keys(SEEDED_PACKAGE_PRICES) as CountryCode[];

  it.each(markets)("stays close to the documented table for %s after pretty-round", (country) => {
    for (const pack of CREDIT_PACKAGES) {
      const computed = computePackagePrice(pack.vndPrice, country);
      const documented = SEEDED_PACKAGE_PRICES[country][pack.id].price;
      expect(computed).toBeGreaterThan(documented * 0.85);
      expect(computed).toBeLessThan(documented * 1.15);
    }
  });
});

describe("isCreditPackageId", () => {
  it("accepts the three packages and rejects anything else", () => {
    expect(isCreditPackageId("pack_1")).toBe(true);
    expect(isCreditPackageId("pack_3")).toBe(true);
    expect(isCreditPackageId("PLUS")).toBe(false);
    expect(isCreditPackageId("pack_4")).toBe(false);
  });
});
