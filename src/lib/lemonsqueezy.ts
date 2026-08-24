// Thin wrapper around the Lemon Squeezy REST API (Merchant of Record —
// LS handles the actual card charge and tax, we only create a checkout
// session and later verify their webhook). See src/app/api/checkout/route.ts
// and src/app/api/webhooks/billing/route.ts for the call sites.

interface CreateCheckoutParams {
  apiKey: string;
  storeId: string;
  variantId: string;
  email: string;
  orderId: string;
  redirectUrl: string;
}

export async function createLemonSqueezyCheckout({
  apiKey,
  storeId,
  variantId,
  email,
  orderId,
  redirectUrl,
}: CreateCheckoutParams): Promise<{ url: string } | { error: string }> {
  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          // order_id round-trips through the webhook's meta.custom_data so
          // we can reconcile the LS event back to our own `orders` row —
          // same pattern as SePay's transactionContent memo code.
          checkout_data: { email, custom: { order_id: orderId } },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    return { error: `Lemon Squeezy API trả về lỗi ${res.status}.` };
  }

  const data = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = data.data?.attributes?.url;
  if (!url) {
    return { error: "Phản hồi Lemon Squeezy không hợp lệ." };
  }
  return { url };
}

// LS signs each webhook body with HMAC-SHA256 (hex digest) in the
// `X-Signature` header, keyed by the per-webhook secret set in the LS
// dashboard. Must run over the raw request bytes — parse JSON only after
// this passes.
export async function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const digestHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (digestHex.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < digestHex.length; i++) {
    diff |= digestHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

export interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: { order_id?: string };
  };
  data?: {
    attributes?: {
      status?: string;
    };
  };
}
