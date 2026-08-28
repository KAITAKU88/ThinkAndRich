import type { CountryCode, MarketPricing } from "./types";
import { COUNTRIES_LIST, fallbackMarketPricing, getMarket } from "./credit-packages";

export { COUNTRIES_LIST, getMarket };

/** Client-side fallback: documented seed prices until /api/pricing hydrates. */
export function getPppPricing(country: CountryCode): MarketPricing {
  return fallbackMarketPricing(country);
}
