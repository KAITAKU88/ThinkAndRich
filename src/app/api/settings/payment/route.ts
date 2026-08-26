import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { readPaymentSettings } from "@/lib/server/settings";
import { isPaymentConfigured } from "@/lib/payment-settings";

// Public on purpose: these are the bank details printed on the customer's
// own transfer QR, so they are shown to anyone who reaches checkout anyway.
// Nothing secret is served here — the webhook secret and gateway API keys
// are Worker secrets and never touch the settings table.
export async function GET() {
  const { env } = getCloudflareContext();
  const payment = await readPaymentSettings(drizzle(env.DB));
  return NextResponse.json({ ok: true, payment, configured: isPaymentConfigured(payment) });
}
