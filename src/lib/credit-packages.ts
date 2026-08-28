import type {
  CountryCode,
  CreditPackageId,
  CurrencyCode,
  MarketPricing,
  PaymentGateway,
} from "@/lib/types";

export const CREDIT_PACKAGES: {
  id: CreditPackageId;
  credits: number;
  vndPrice: number;
}[] = [
  { id: "pack_1", credits: 1_500, vndPrice: 150_000 },
  { id: "pack_2", credits: 4_500, vndPrice: 300_000 },
  { id: "pack_3", credits: 10_000, vndPrice: 500_000 },
];

export const CREDIT_PACKAGE_IDS = CREDIT_PACKAGES.map((p) => p.id) as [
  CreditPackageId,
  CreditPackageId,
  CreditPackageId,
];

export function isCreditPackageId(value: unknown): value is CreditPackageId {
  return value === "pack_1" || value === "pack_2" || value === "pack_3";
}

export function packageById(id: CreditPackageId) {
  const found = CREDIT_PACKAGES.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown credit package: ${id}`);
  return found;
}

/** PPP multipliers vs VN, from CREDIT_PRICING_MODEL.md (derived from former PLUS prices). */
export const PPP_MULTIPLIERS: Record<CountryCode, number> = {
  VN: 1,
  US: 4.1,
  EU: 3.55,
  JP: 2.78,
  KR: 2.79,
  TW: 2.38,
  CN: 1.73,
  DEFAULT: 3.26,
};

/**
 * VND per 1 unit of the market currency — reference rates at the time the
 * model was written, not a live feed. Auto-refresh replaces these in DB.
 */
export const FX_VND_PER_UNIT: Record<CountryCode, number> = {
  VN: 1,
  US: 25_000,
  EU: 27_200,
  JP: 167,
  KR: 18.5,
  TW: 794,
  CN: 3_472,
  DEFAULT: 25_000,
};

export interface MarketMeta {
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  currency: CurrencyCode;
  currencySymbol: string;
  gateway: PaymentGateway;
  pppMultiplier: number;
  fxVndPerUnit: number;
}

export const MARKET_META: Record<CountryCode, MarketMeta> = {
  VN: {
    countryCode: "VN",
    countryName: "Việt Nam",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    gateway: "sepay",
    pppMultiplier: PPP_MULTIPLIERS.VN,
    fxVndPerUnit: FX_VND_PER_UNIT.VN,
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.US,
    fxVndPerUnit: FX_VND_PER_UNIT.US,
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union",
    flag: "🇪🇺",
    currency: "EUR",
    currencySymbol: "€",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.EU,
    fxVndPerUnit: FX_VND_PER_UNIT.EU,
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan (日本)",
    flag: "🇯🇵",
    currency: "JPY",
    currencySymbol: "¥",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.JP,
    fxVndPerUnit: FX_VND_PER_UNIT.JP,
  },
  KR: {
    countryCode: "KR",
    countryName: "South Korea (대한민국)",
    flag: "🇰🇷",
    currency: "KRW",
    currencySymbol: "₩",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.KR,
    fxVndPerUnit: FX_VND_PER_UNIT.KR,
  },
  TW: {
    countryCode: "TW",
    countryName: "Taiwan (台灣)",
    flag: "🇹🇼",
    currency: "TWD",
    currencySymbol: "NT$",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.TW,
    fxVndPerUnit: FX_VND_PER_UNIT.TW,
  },
  CN: {
    countryCode: "CN",
    countryName: "China (中国)",
    flag: "🇨🇳",
    currency: "CNY",
    currencySymbol: "¥",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.CN,
    fxVndPerUnit: FX_VND_PER_UNIT.CN,
  },
  DEFAULT: {
    countryCode: "DEFAULT",
    countryName: "International / Other Countries",
    flag: "🌐",
    currency: "USD",
    currencySymbol: "$",
    gateway: "paddle",
    pppMultiplier: PPP_MULTIPLIERS.DEFAULT,
    fxVndPerUnit: FX_VND_PER_UNIT.DEFAULT,
  },
};

export const COUNTRIES_LIST: {
  code: CountryCode;
  name: string;
  flag: string;
  gateway: PaymentGateway;
}[] = (Object.values(MARKET_META) as MarketMeta[]).map((m) => ({
  code: m.countryCode,
  name: `${m.countryName} (${m.currencySymbol} ${m.currency} — ${m.gateway === "sepay" ? "SePay" : "Paddle"})`,
  flag: m.flag,
  gateway: m.gateway,
}));

/**
 * Documented list prices from CREDIT_PRICING_MODEL.md — the initial
 * `market_pricing` seed and the client-side fallback when DB is empty.
 */
export const SEEDED_PACKAGE_PRICES: Record<
  CountryCode,
  Record<CreditPackageId, { price: number; formatted: string }>
> = {
  VN: {
    pack_1: { price: 150_000, formatted: "150.000₫" },
    pack_2: { price: 300_000, formatted: "300.000₫" },
    pack_3: { price: 500_000, formatted: "500.000₫" },
  },
  US: {
    pack_1: { price: 25, formatted: "$25" },
    pack_2: { price: 49, formatted: "$49" },
    pack_3: { price: 79, formatted: "$79" },
  },
  EU: {
    pack_1: { price: 19, formatted: "€19" },
    pack_2: { price: 39, formatted: "€39" },
    pack_3: { price: 65, formatted: "€65" },
  },
  JP: {
    pack_1: { price: 2_480, formatted: "¥2,480" },
    pack_2: { price: 4_980, formatted: "¥4,980" },
    pack_3: { price: 8_480, formatted: "¥8,480" },
  },
  KR: {
    pack_1: { price: 23_000, formatted: "₩23,000" },
    pack_2: { price: 45_000, formatted: "₩45,000" },
    pack_3: { price: 75_000, formatted: "₩75,000" },
  },
  TW: {
    pack_1: { price: 449, formatted: "NT$449" },
    pack_2: { price: 899, formatted: "NT$899" },
    pack_3: { price: 1_499, formatted: "NT$1,499" },
  },
  CN: {
    pack_1: { price: 75, formatted: "¥75" },
    pack_2: { price: 149, formatted: "¥149" },
    pack_3: { price: 249, formatted: "¥249" },
  },
  DEFAULT: {
    pack_1: { price: 19, formatted: "$19" },
    pack_2: { price: 39, formatted: "$39" },
    pack_3: { price: 65, formatted: "$65" },
  },
};

export function getMarket(country: CountryCode): MarketMeta {
  return MARKET_META[country] || MARKET_META.DEFAULT;
}

export function formatPackagePrice(amount: number, country: CountryCode): string {
  const market = getMarket(country);
  switch (market.currency) {
    case "VND":
      return `${amount.toLocaleString("vi-VN")}₫`;
    case "USD":
      return `$${amount.toLocaleString("en-US")}`;
    case "EUR":
      return `€${amount.toLocaleString("en-US")}`;
    case "JPY":
      return `¥${amount.toLocaleString("en-US")}`;
    case "KRW":
      return `₩${amount.toLocaleString("en-US")}`;
    case "TWD":
      return `NT$${amount.toLocaleString("en-US")}`;
    case "CNY":
      return `¥${amount.toLocaleString("en-US")}`;
  }
}

/**
 * Round a raw converted price to a locally "pretty" figure.
 * USD/EUR/CNY/TWD prefer a 9-ending; JPY/KRW round to a round hundred/thousand.
 * VND rounds to the nearest thousand.
 *
 * The documented table is the source of truth for the initial seed; this
 * function is what a refresh uses when FX/PPP move.
 */
export function prettyRoundPrice(raw: number, currency: CurrencyCode): number {
  if (!Number.isFinite(raw) || raw < 0) return 0;
  switch (currency) {
    case "VND":
      return Math.round(raw / 1_000) * 1_000;
    case "KRW":
      return Math.round(raw / 1_000) * 1_000;
    case "JPY": {
      // Charm prices sit on n000−20 (2,480 / 4,980 / 8,480): nearest 500, then −20.
      const toFiveHundred = Math.round(raw / 500) * 500;
      return Math.max(80, toFiveHundred - 20);
    }
    case "USD": {
      const nearest = Math.round(raw);
      if (nearest >= 70) {
        const down9 = Math.floor(nearest / 10) * 10 - 1;
        return down9;
      }
      return nearest;
    }
    case "EUR":
    case "CNY":
    case "TWD":
      return Math.round(raw);
  }
}

export function computeRawPrice(vndPrice: number, country: CountryCode): number {
  const market = getMarket(country);
  if (market.currency === "VND") return vndPrice;
  return (vndPrice / market.fxVndPerUnit) * market.pppMultiplier;
}

export function computePackagePrice(vndPrice: number, country: CountryCode): number {
  return prettyRoundPrice(computeRawPrice(vndPrice, country), getMarket(country).currency);
}

export function fallbackMarketPricing(country: CountryCode): MarketPricing {
  const market = getMarket(country);
  const packages = SEEDED_PACKAGE_PRICES[country] ?? SEEDED_PACKAGE_PRICES.DEFAULT;
  return {
    countryCode: market.countryCode,
    countryName: market.countryName,
    flag: market.flag,
    currency: market.currency,
    currencySymbol: market.currencySymbol,
    gateway: market.gateway,
    pppMultiplier: market.pppMultiplier,
    packages,
  };
}

/** @deprecated Use fallbackMarketPricing / DB-backed loadMarketPricing. Kept as the client fallback. */
export function getPppPricing(country: CountryCode): MarketPricing {
  return fallbackMarketPricing(country);
}
