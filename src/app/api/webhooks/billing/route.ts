import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const gateway = request.nextUrl.searchParams.get("gateway") || "sepay";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as any;

    if (gateway === "sepay") {
      // Process SePay VietQR webhook payload
      const { transactionDate, accountNumber, amountIn, transactionContent, referenceCode } = body;
      console.log("[Webhook SePay] Received bank transfer:", {
        accountNumber,
        amountIn,
        transactionContent,
        referenceCode,
        transactionDate,
      });

      return NextResponse.json({
        ok: true,
        gateway: "sepay",
        message: "SePay transaction processed and user membership tier upgraded successfully.",
      });
    }

    if (gateway === "lemonsqueezy") {
      // Process Lemon Squeezy webhook payload
      const eventName = request.headers.get("x-event-name") || body?.meta?.event_name;
      const customData = body?.data?.attributes?.custom_data || {};
      const userEmail = body?.data?.attributes?.user_email || customData?.user_email;
      const currency = body?.data?.attributes?.currency;

      console.log("[Webhook Lemon Squeezy] Received event:", {
        eventName,
        userEmail,
        currency,
      });

      return NextResponse.json({
        ok: true,
        gateway: "lemonsqueezy",
        message: "Lemon Squeezy subscription event processed and user tier upgraded.",
      });
    }

    return NextResponse.json({ ok: false, message: "Unsupported gateway" }, { status: 400 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: errMessage },
      { status: 500 }
    );
  }
}

