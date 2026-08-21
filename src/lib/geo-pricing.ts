import type { CountryCode, PppPricingConfig } from "./types";

export const PPP_PRICING_MAP: Record<CountryCode, PppPricingConfig> = {
  VN: {
    countryCode: "VN",
    countryName: "Việt Nam",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    gateway: "sepay",
    pppFactorNote: "Thị trường cơ sở (Base)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 VNĐ",
      },
      PLUS: {
        price: 299000,
        formatted: "299.000 VNĐ",
      },
      PRO: {
        price: 499000,
        formatted: "499.000 VNĐ",
      },
    },
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua cao nhất (~ x4 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "$0",
      },
      PLUS: {
        price: 49,
        formatted: "$49",
      },
      PRO: {
        price: 89,
        formatted: "$89",
      },
    },
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union",
    flag: "🇪🇺",
    currency: "EUR",
    currencySymbol: "€",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua cao (~ x3.5 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 €",
      },
      PLUS: {
        price: 39,
        formatted: "39 €",
      },
      PRO: {
        price: 75,
        formatted: "75 €",
      },
    },
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan (日本)",
    flag: "🇯🇵",
    currency: "JPY",
    currencySymbol: "¥",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua cao (~ x2.5 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 ¥",
      },
      PLUS: {
        price: 4980,
        formatted: "4,980 ¥",
      },
      PRO: {
        price: 8980,
        formatted: "8,980 ¥",
      },
    },
  },
  KR: {
    countryCode: "KR",
    countryName: "South Korea (대한민국)",
    flag: "🇰🇷",
    currency: "KRW",
    currencySymbol: "₩",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua cao (~ x2.5 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 ₩",
      },
      PLUS: {
        price: 45000,
        formatted: "45,000 ₩",
      },
      PRO: {
        price: 79000,
        formatted: "79,000 ₩",
      },
    },
  },
  TW: {
    countryCode: "TW",
    countryName: "Taiwan (台灣)",
    flag: "🇹🇼",
    currency: "TWD",
    currencySymbol: "NT$",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua trung bình cao (~ x2 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 NT$",
      },
      PLUS: {
        price: 899,
        formatted: "899 NT$",
      },
      PRO: {
        price: 1599,
        formatted: "1,599 NT$",
      },
    },
  },
  CN: {
    countryCode: "CN",
    countryName: "China (中国)",
    flag: "🇨🇳",
    currency: "CNY",
    currencySymbol: "¥",
    gateway: "lemonsqueezy",
    pppFactorNote: "Sức mua trung bình (~ x1.5 lần VN)",
    plans: {
      FREE: {
        price: 0,
        formatted: "0 ¥",
      },
      PLUS: {
        price: 149,
        formatted: "149 ¥",
      },
      PRO: {
        price: 259,
        formatted: "259 ¥",
      },
    },
  },
  DEFAULT: {
    countryCode: "DEFAULT",
    countryName: "International / Other Countries",
    flag: "🌐",
    currency: "USD",
    currencySymbol: "$",
    gateway: "lemonsqueezy",
    pppFactorNote: "Mức giá chung cho các khu vực còn lại",
    plans: {
      FREE: {
        price: 0,
        formatted: "$0",
      },
      PLUS: {
        price: 39,
        formatted: "$39",
      },
      PRO: {
        price: 69,
        formatted: "$69",
      },
    },
  },
};

export const COUNTRIES_LIST: { code: CountryCode; name: string; flag: string; gateway: "sepay" | "lemonsqueezy" }[] = [
  { code: "VN", name: "Việt Nam (VNĐ - SePay)", flag: "🇻🇳", gateway: "sepay" },
  { code: "US", name: "United States ($ USD - Lemon Squeezy)", flag: "🇺🇸", gateway: "lemonsqueezy" },
  { code: "EU", name: "European Union (€ EUR - Lemon Squeezy)", flag: "🇪🇺", gateway: "lemonsqueezy" },
  { code: "JP", name: "Japan (¥ JPY - Lemon Squeezy)", flag: "🇯🇵", gateway: "lemonsqueezy" },
  { code: "KR", name: "South Korea (₩ KRW - Lemon Squeezy)", flag: "🇰🇷", gateway: "lemonsqueezy" },
  { code: "TW", name: "Taiwan (NT$ TWD - Lemon Squeezy)", flag: "🇹🇼", gateway: "lemonsqueezy" },
  { code: "CN", name: "China (¥ CNY - Lemon Squeezy)", flag: "🇨🇳", gateway: "lemonsqueezy" },
  { code: "DEFAULT", name: "Rest of the World ($ USD - Lemon Squeezy)", flag: "🌐", gateway: "lemonsqueezy" },
];

export function getPppPricing(country: CountryCode): PppPricingConfig {
  return PPP_PRICING_MAP[country] || PPP_PRICING_MAP.DEFAULT;
}
