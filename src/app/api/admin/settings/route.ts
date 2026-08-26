import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { requireAdmin } from "@/lib/api-auth";
import { readPaymentSettings, writePaymentSettings } from "@/lib/server/settings";
import {
  isPaymentConfigured,
  validatePaymentSettings,
  type PaymentSettings,
} from "@/lib/payment-settings";

// Operator settings, admin only. Currently the SePay bank details a
// customer is told to transfer to — previously hard-coded in the checkout
// component, which meant correcting them took a deploy and getting them
// wrong sent real money to a stranger.

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const payment = await readPaymentSettings(drizzle(ctx.env.DB));
  return NextResponse.json({ ok: true, payment, configured: isPaymentConfigured(payment) });
}

export async function PUT(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { payment?: Partial<PaymentSettings> } | null;
  if (!body?.payment) {
    return NextResponse.json({ ok: false, message: "Thiếu dữ liệu cấu hình." }, { status: 400 });
  }

  const invalid = validatePaymentSettings(body.payment);
  if (invalid) {
    return NextResponse.json({ ok: false, message: invalid }, { status: 400 });
  }

  const payment = await writePaymentSettings(
    drizzle(ctx.env.DB),
    body.payment,
    ctx.session.email
  );
  return NextResponse.json({ ok: true, payment, configured: isPaymentConfigured(payment) });
}
