/**
 * Shape and rules for the operator-editable payment settings.
 *
 * Deliberately free of any database import: the checkout page and the admin
 * form both need these, and pulling src/lib/server/settings.ts into a client
 * component would bundle Drizzle and the D1 driver with it. Keeping the
 * rules here also means they can be unit-tested without a database.
 *
 * Bank details are shown to customers on the VietQR screen. Gateway secrets
 * (SePay API key, Paddle API key, Paddle webhook secret) live in the same
 * table so they can be changed without a deploy, but they are never sent on
 * the public payment endpoint.
 */

export const PUBLIC_PAYMENT_FIELDS = [
  "bankCode",
  "bankName",
  "bankAccountNumber",
  "bankAccountHolder",
] as const;

export type PublicPaymentSettings = Pick<PaymentSettings, (typeof PUBLIC_PAYMENT_FIELDS)[number]>;

export type PaymentStringKey = Exclude<keyof PaymentSettings, "paddleSandbox">;

export interface PaymentSettings {
  /** VietQR bank code, e.g. "MB". Goes straight into the QR image URL. */
  bankCode: string;
  /** Human-readable bank name shown beside the QR. */
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  /**
   * SePay dashboard API key. Compared against `Authorization: Apikey …`
   * on `/api/webhooks/billing?gateway=sepay`.
   */
  sepayWebhookSecret: string;
  /** Paddle Billing seller API key (`pdl_…`). */
  paddleApiKey: string;
  /** Paddle notification secret, used to verify `Paddle-Signature`. */
  paddleWebhookSecret: string;
  /** When true, calls sandbox-api.paddle.com instead of api.paddle.com. */
  paddleSandbox: boolean;
  paddlePricePack1: string;
  paddlePricePack2: string;
  paddlePricePack3: string;
}

/**
 * Empty rather than a plausible-looking placeholder. A blank field makes an
 * unconfigured site obvious at a glance and lets the checkout refuse to draw
 * a QR at all; a stand-in account number just looks configured and quietly
 * sends money somewhere else, which is exactly what happened here.
 *
 * Paddle defaults to sandbox so the first keys an operator pastes cannot
 * hit the live API until they explicitly turn that off.
 */
export const EMPTY_PAYMENT_SETTINGS: PaymentSettings = {
  bankCode: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  sepayWebhookSecret: "",
  paddleApiKey: "",
  paddleWebhookSecret: "",
  paddleSandbox: true,
  paddlePricePack1: "",
  paddlePricePack2: "",
  paddlePricePack3: "",
};

export function toPublicPaymentSettings(settings: PaymentSettings): PublicPaymentSettings {
  return {
    bankCode: settings.bankCode,
    bankName: settings.bankName,
    bankAccountNumber: settings.bankAccountNumber,
    bankAccountHolder: settings.bankAccountHolder,
  };
}

/**
 * Whether the SePay branch of checkout can actually take money. Every bank
 * field matters: the code and account build the QR, and the holder's name
 * is what a customer checks before confirming a transfer. The webhook
 * secret is not part of this — a missing secret still must not produce a
 * QR, but it is a separate "webhook will not confirm" problem; the QR
 * itself only needs the four bank fields.
 */
export function isSepayBankConfigured(settings: PublicPaymentSettings): boolean {
  return PUBLIC_PAYMENT_FIELDS.every((field) => settings[field].trim().length > 0);
}

/** @deprecated Use isSepayBankConfigured — kept as the public `configured` flag. */
export function isPaymentConfigured(settings: PublicPaymentSettings): boolean {
  return isSepayBankConfigured(settings);
}

export function isSepayWebhookConfigured(settings: Pick<PaymentSettings, "sepayWebhookSecret">): boolean {
  return settings.sepayWebhookSecret.trim().length > 0;
}

export function isPaddleConfigured(settings: PaymentSettings): boolean {
  return (
    settings.paddleApiKey.trim().length > 0 &&
    settings.paddleWebhookSecret.trim().length > 0 &&
    settings.paddlePricePack1.trim().length > 0 &&
    settings.paddlePricePack2.trim().length > 0 &&
    settings.paddlePricePack3.trim().length > 0
  );
}

export function paddlePriceIdForPackage(
  settings: PaymentSettings,
  packageId: "pack_1" | "pack_2" | "pack_3"
): string {
  if (packageId === "pack_3") return settings.paddlePricePack3.trim();
  if (packageId === "pack_2") return settings.paddlePricePack2.trim();
  return settings.paddlePricePack1.trim();
}

/** Public origin used to tell the operator where to point SePay / Paddle webhooks. */
export function billingWebhookUrls(origin: string): { sepay: string; paddle: string } {
  const base = origin.replace(/\/$/, "");
  return {
    sepay: `${base}/api/webhooks/billing?gateway=sepay`,
    paddle: `${base}/api/webhooks/billing?gateway=paddle`,
  };
}

/** Validation shared by the API and the admin form, so both agree. */
export function validatePaymentSettings(input: Partial<PaymentSettings>): string | null {
  if (input.bankCode !== undefined && input.bankCode.trim() && !/^[A-Za-z]{2,12}$/.test(input.bankCode.trim())) {
    return "Mã ngân hàng chỉ gồm chữ cái (ví dụ: MB, VCB, TCB).";
  }
  if (
    input.bankAccountNumber !== undefined &&
    input.bankAccountNumber.trim() &&
    !/^[0-9]{6,20}$/.test(input.bankAccountNumber.trim())
  ) {
    return "Số tài khoản chỉ gồm chữ số (6–20 chữ số).";
  }
  // The holder's name goes into the QR payload, which banks render in
  // uppercase unaccented Latin — anything else comes out mangled on the
  // customer's transfer screen.
  if (
    input.bankAccountHolder !== undefined &&
    input.bankAccountHolder.trim() &&
    !/^[A-Za-z0-9 .,'-]{2,64}$/.test(input.bankAccountHolder.trim())
  ) {
    return "Tên chủ tài khoản chỉ gồm chữ không dấu, số và khoảng trắng.";
  }
  if (input.paddleSandbox !== undefined && typeof input.paddleSandbox !== "boolean") {
    return "Chế độ Paddle Sandbox phải là bật hoặc tắt.";
  }
  if (input.paddleApiKey !== undefined && input.paddleApiKey.trim() && input.paddleApiKey.trim().length < 16) {
    return "Paddle API key quá ngắn.";
  }
  for (const [field, label] of [
    ["paddlePricePack1", "Price ID gói 1.500C"] as const,
    ["paddlePricePack2", "Price ID gói 4.500C"] as const,
    ["paddlePricePack3", "Price ID gói 10.000C"] as const,
  ]) {
    const value = input[field];
    if (value !== undefined && value.trim() && !/^pri_[a-zA-Z0-9]+$/.test(value.trim())) {
      return `${label} phải có dạng pri_… (Paddle Price ID).`;
    }
  }
  return null;
}
