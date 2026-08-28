/**
 * Thin wrapper around Paddle Billing (Merchant of Record — Paddle handles
 * the card charge and tax; we create a one-time transaction and later
 * verify their webhook). See src/app/api/checkout/route.ts and
 * src/app/api/webhooks/billing/route.ts.
 */

interface CreateTransactionParams {
  apiKey: string;
  sandbox: boolean;
  priceId: string;
  orderId: string;
}

export function paddleApiBase(sandbox: boolean): string {
  return sandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

export async function createPaddleCheckout({
  apiKey,
  sandbox,
  priceId,
  orderId,
}: CreateTransactionParams): Promise<{ url: string } | { error: string }> {
  const res = await fetch(`${paddleApiBase(sandbox)}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Paddle-Version": "1",
    },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: { order_id: orderId },
    }),
  });

  if (!res.ok) {
    return { error: `Paddle API trả về lỗi ${res.status}.` };
  }

  const data = (await res.json()) as {
    data?: { checkout?: { url?: string | null } };
  };
  const url = data.data?.checkout?.url;
  if (!url) {
    return { error: "Phản hồi Paddle không có URL thanh toán." };
  }
  return { url };
}

/**
 * Paddle signs `${ts}:${rawBody}` with HMAC-SHA256 (hex) and sends
 * `Paddle-Signature: ts=…;h1=…`. Must run over the raw request bytes —
 * parse JSON only after this passes.
 *
 * https://developer.paddle.com/webhooks/signature-verification
 */
export async function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    })
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${rawBody}`));
  const digestHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return timingSafeEqualString(digestHex, h1);
}

export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface PaddleWebhookPayload {
  event_type?: string;
  data?: {
    status?: string;
    custom_data?: { order_id?: string } | null;
  };
}

export function isPaddlePaidEvent(payload: PaddleWebhookPayload): boolean {
  const event = payload.event_type ?? "";
  const status = payload.data?.status ?? "";
  return (
    event === "transaction.completed" ||
    event === "transaction.paid" ||
    status === "completed" ||
    status === "paid"
  );
}
