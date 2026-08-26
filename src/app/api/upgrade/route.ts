import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { UPGRADE_REFUSAL_MESSAGES, buildUpgradeOffer } from "@/lib/server/upgrade";
import type { CountryCode } from "@/lib/types";

// Mid-term PLUS → PRO upgrade.
//
// GET  quotes it — what the term is still worth, what is owed today, when
//      the new PRO year ends. Read-only; the modal calls this.
// POST commits to it by opening a PENDING order for the top-up.
//
// The tier itself is NOT granted here. Money settles through the gateway and
// the billing webhook flips the order to PAID and moves the account, exactly
// as a first-time purchase does — see src/app/api/webhooks/billing/route.ts.
// Granting PRO at the moment the order is created would hand it out for free
// to anyone who opened the modal.

function countryFrom(request: NextRequest): CountryCode {
  return (request.nextUrl.searchParams.get("country") as CountryCode) || "VN";
}

export async function GET(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const result = await buildUpgradeOffer(db, ctx.session.sub, countryFrom(request));
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason, message: UPGRADE_REFUSAL_MESSAGES[result.reason] },
      { status: result.reason === "GATEWAY_UNSUPPORTED" ? 503 : 409 }
    );
  }

  const { quote, ...rest } = result.offer;
  return NextResponse.json({
    ok: true,
    ...rest,
    daysUsed: quote.daysUsed,
    spentValue: quote.spentValue,
    remainingCredit: quote.remainingCredit,
    topUpAmount: quote.topUpAmount,
    currency: quote.currency,
    expiresAt: quote.expiresAt.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  // Re-quoted here rather than taken from the request: the client has seen a
  // number, but between seeing it and clicking, the term has aged and the
  // price it implies has moved. The server's figure is the only one that
  // decides what gets charged.
  const result = await buildUpgradeOffer(db, ctx.session.sub, countryFrom(request));
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason, message: UPGRADE_REFUSAL_MESSAGES[result.reason] },
      { status: result.reason === "GATEWAY_UNSUPPORTED" ? 503 : 409 }
    );
  }

  const { quote } = result.offer;
  const id = `ord_${crypto.randomUUID()}`;

  await db.insert(orders).values({
    id,
    userId: ctx.session.sub,
    gateway: "sepay",
    // The order buys a PRO term; the webhook reads this to know what to grant.
    tier: "PRO",
    amount: quote.topUpAmount,
    currency: quote.currency,
    status: "PENDING",
    gatewayReference: id,
    rawPayload: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  });

  return NextResponse.json({
    ok: true,
    orderId: id,
    amount: quote.topUpAmount,
    currency: quote.currency,
    remainingCredit: quote.remainingCredit,
    expiresAt: quote.expiresAt.toISOString(),
  });
}
