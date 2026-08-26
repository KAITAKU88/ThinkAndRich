import { wrangler } from "./otp";

/**
 * Seed or clear the operator payment settings straight in the local D1.
 *
 * Tests that reach a VietQR code need the bank details configured, and tests
 * about the unconfigured state need them gone. Doing it through the database
 * rather than the admin UI keeps each spec independent: relying on another
 * spec having run first is how a suite starts passing only in one order.
 */
export const TEST_PAYMENT_SETTINGS = {
  bankCode: "MB",
  bankName: "MBBank (Ngan hang Quan Doi)",
  bankAccountNumber: "0123456789",
  bankAccountHolder: "THINK AND RICH CO LTD",
} as const;

const KEYS: Record<keyof typeof TEST_PAYMENT_SETTINGS, string> = {
  bankCode: "payment.sepay.bankCode",
  bankName: "payment.sepay.bankName",
  bankAccountNumber: "payment.sepay.accountNumber",
  bankAccountHolder: "payment.sepay.accountHolder",
};

export function seedPaymentSettings(): void {
  const now = new Date().toISOString();
  const values = (Object.keys(KEYS) as (keyof typeof TEST_PAYMENT_SETTINGS)[])
    .map((field) => `('${KEYS[field]}', '${TEST_PAYMENT_SETTINGS[field]}', '${now}', 'e2e')`)
    .join(", ");
  d1(`INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES ${values}
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`);
}

export function clearPaymentSettings(): void {
  d1("DELETE FROM app_settings WHERE key LIKE 'payment.%';");
}

function d1(command: string): void {
  wrangler(["d1", "execute", "thinkandrich-db", "--local", "--command", command]);
}
