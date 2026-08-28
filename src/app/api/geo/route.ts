import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { loadMarketPricing } from "@/lib/server/market-pricing";
import type { CountryCode, SupportedLanguage } from "@/lib/types";

const COUNTRY_TO_LANG_MAP: Record<CountryCode, SupportedLanguage> = {
  VN: "vi",
  US: "en",
  EU: "en",
  JP: "ja",
  KR: "ko",
  TW: "zh",
  CN: "zh",
  DEFAULT: "en",
};

export async function GET(request: NextRequest) {
  // Extract GeoIP header from Cloudflare, Vercel, or custom proxy
  const cfCountry = request.headers.get("cf-ipcountry")?.toUpperCase();
  const vercelCountry = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const rawCountry = cfCountry || vercelCountry;

  let countryCode: CountryCode = "VN"; // Default to VN as base market if local/unknown

  if (rawCountry) {
    if (rawCountry === "VN") countryCode = "VN";
    else if (rawCountry === "US") countryCode = "US";
    else if (["GB", "FR", "DE", "IT", "ES", "NL", "BE", "SE", "CH", "AT"].includes(rawCountry)) countryCode = "EU";
    else if (rawCountry === "JP") countryCode = "JP";
    else if (rawCountry === "KR") countryCode = "KR";
    else if (rawCountry === "TW") countryCode = "TW";
    else if (rawCountry === "CN" || rawCountry === "HK") countryCode = "CN";
    else countryCode = "DEFAULT";
  }

  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);
  const pppConfig = await loadMarketPricing(db, countryCode);
  const suggestedLang = COUNTRY_TO_LANG_MAP[countryCode] || "en";

  return NextResponse.json({
    ok: true,
    country_code: countryCode,
    country_name: pppConfig.countryName,
    flag: pppConfig.flag,
    currency: pppConfig.currency,
    currency_symbol: pppConfig.currencySymbol,
    gateway: pppConfig.gateway,
    suggested_lang: suggestedLang,
    ppp_note: `PPP x${pppConfig.pppMultiplier}`,
    pricing: pppConfig.packages,
  });
}
