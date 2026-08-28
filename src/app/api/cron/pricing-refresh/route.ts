import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { runDuePricingRefresh } from "@/lib/server/pricing-refresh";

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const expected = env.CRON_SECRET;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || got !== expected) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const db = drizzle(env.DB);
  const result = await runDuePricingRefresh(db, env.OTP_KV);
  return NextResponse.json({ ok: true, result });
}

export async function GET(request: Request) {
  return POST(request);
}
