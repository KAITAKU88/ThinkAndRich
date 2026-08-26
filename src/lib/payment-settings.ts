/**
 * Shape and rules for the operator-editable payment settings.
 *
 * Deliberately free of any database import: the checkout page and the admin
 * form both need these, and pulling src/lib/server/settings.ts into a client
 * component would bundle Drizzle and the D1 driver with it. Keeping the
 * rules here also means they can be unit-tested without a database.
 */

export interface PaymentSettings {
  /** VietQR bank code, e.g. "MB". Goes straight into the QR image URL. */
  bankCode: string;
  /** Human-readable bank name shown beside the QR. */
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

/**
 * Empty rather than a plausible-looking placeholder. A blank field makes an
 * unconfigured site obvious at a glance and lets the checkout refuse to draw
 * a QR at all; a stand-in account number just looks configured and quietly
 * sends money somewhere else, which is exactly what happened here.
 */
export const EMPTY_PAYMENT_SETTINGS: PaymentSettings = {
  bankCode: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
};

/**
 * Whether the SePay branch of checkout can actually take money. Every field
 * matters: the code and account build the QR, and the holder's name is what
 * a customer checks before confirming a transfer.
 */
export function isPaymentConfigured(settings: PaymentSettings): boolean {
  return Object.values(settings).every((value) => value.trim().length > 0);
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
  return null;
}
