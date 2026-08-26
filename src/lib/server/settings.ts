import { inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { appSettings } from "@/db/schema";
import { EMPTY_PAYMENT_SETTINGS, type PaymentSettings } from "@/lib/payment-settings";

/**
 * Reads and writes the operator-editable configuration in `app_settings`.
 *
 * The payment block is the reason this exists: the bank account a customer
 * is told to transfer to was a hard-coded placeholder in the checkout
 * component, so every VietQR code the site had ever produced pointed at an
 * account nobody owned. Details like that belong to whoever runs the site,
 * not to a deploy.
 *
 * Secrets are deliberately absent — see the note on the table in
 * src/db/schema.ts. Everything here is shown to customers anyway.
 *
 * The shape, the defaults and the validation live in
 * src/lib/payment-settings.ts so the browser can use them too.
 */

const PAYMENT_KEYS: Record<keyof PaymentSettings, string> = {
  bankCode: "payment.sepay.bankCode",
  bankName: "payment.sepay.bankName",
  bankAccountNumber: "payment.sepay.accountNumber",
  bankAccountHolder: "payment.sepay.accountHolder",
};

type Db = DrizzleD1Database<Record<string, never>>;

export async function readPaymentSettings(db: Db): Promise<PaymentSettings> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, Object.values(PAYMENT_KEYS)))
    .all();

  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const entries = Object.entries(PAYMENT_KEYS) as [keyof PaymentSettings, string][];

  return entries.reduce((settings, [field, key]) => {
    settings[field] = (byKey.get(key) ?? "").trim();
    return settings;
  }, { ...EMPTY_PAYMENT_SETTINGS });
}

export async function writePaymentSettings(
  db: Db,
  input: Partial<PaymentSettings>,
  updatedBy: string
): Promise<PaymentSettings> {
  const now = new Date().toISOString();
  const entries = (Object.entries(PAYMENT_KEYS) as [keyof PaymentSettings, string][]).filter(
    ([field]) => input[field] !== undefined
  );

  if (entries.length > 0) {
    // One batch, not four awaited statements. These four values are a single
    // setting — an account you can transfer to — and written one at a time a
    // read landing mid-sequence sees a half-configured account: a bank code
    // that no longer matches the account number it is paired with. Batching
    // them means a reader sees the old account or the new one, never a
    // mixture of both.
    const statements = entries.map(([field, key]) => {
      const value = (input[field] ?? "").trim();
      return db
        .insert(appSettings)
        .values({ key, value, updatedAt: now, updatedBy })
        .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: now, updatedBy } });
    });
    await db.batch(statements as unknown as Parameters<Db["batch"]>[0]);
  }

  return readPaymentSettings(db);
}
