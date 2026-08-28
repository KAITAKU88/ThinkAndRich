import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { loadAllMarketPricing } from "@/lib/server/market-pricing";

export async function GET() {
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);
  const markets = await loadAllMarketPricing(db);
  return NextResponse.json({ ok: true, markets });
}
