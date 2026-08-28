import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { readPaymentSettings } from "@/lib/server/settings";
import { isSepayBankConfigured, toPublicPaymentSettings } from "@/lib/payment-settings";

// Public on purpose: these are the bank details printed on the customer's
// own transfer QR, so they are shown to anyone who reaches checkout anyway.
// Gateway secrets stay in app_settings and are never included here.
export async function GET() {
  const { env } = getCloudflareContext();
  const payment = await readPaymentSettings(drizzle(env.DB));
  return NextResponse.json({
    ok: true,
    payment: toPublicPaymentSettings(payment),
    configured: isSepayBankConfigured(payment),
  });
}
