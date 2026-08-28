import { inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { appSettings } from "@/db/schema";
import {
  EMPTY_PAYMENT_SETTINGS,
  type PaymentSettings,
  type PaymentStringKey,
} from "@/lib/payment-settings";

/**
 * Reads and writes the operator-editable configuration in `app_settings`.
 *
 * The payment block is the reason this exists: the bank account a customer
 * is told to transfer to was a hard-coded placeholder in the checkout
 * component, so every VietQR code the site had ever produced pointed at an
 * account nobody owned. Gateway API keys used to live as Worker secrets,
 * which meant filling in Paddle required a deploy. Both belong to whoever
 * runs the site, not to a build.
 *
 * Secrets in this table are never served on GET /api/settings/payment.
 *
 * The shape, the defaults and the validation live in
 * src/lib/payment-settings.ts so the browser can use them too.
 */

const STRING_KEYS: Record<PaymentStringKey, string> = {
  bankCode: "payment.sepay.bankCode",
  bankName: "payment.sepay.bankName",
  bankAccountNumber: "payment.sepay.accountNumber",
  bankAccountHolder: "payment.sepay.accountHolder",
  sepayWebhookSecret: "payment.sepay.webhookSecret",
  paddleApiKey: "payment.paddle.apiKey",
  paddleWebhookSecret: "payment.paddle.webhookSecret",
  paddlePricePack1: "payment.paddle.pricePack1",
  paddlePricePack2: "payment.paddle.pricePack2",
  paddlePricePack3: "payment.paddle.pricePack3",
};

const PADDLE_SANDBOX_KEY = "payment.paddle.sandbox";

const ALL_KEYS = [...Object.values(STRING_KEYS), PADDLE_SANDBOX_KEY];

type Db = DrizzleD1Database<Record<string, never>>;

export async function readPaymentSettings(db: Db): Promise<PaymentSettings> {
  const rows = await db.select().from(appSettings).where(inArray(appSettings.key, ALL_KEYS)).all();

  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const settings = { ...EMPTY_PAYMENT_SETTINGS };
  const entries = Object.entries(STRING_KEYS) as [PaymentStringKey, string][];

  for (const [field, key] of entries) {
    settings[field] = (byKey.get(key) ?? "").trim();
  }

  const storedSandbox = byKey.get(PADDLE_SANDBOX_KEY);
  if (storedSandbox !== undefined) {
    settings.paddleSandbox = storedSandbox === "true";
  }

  return settings;
}

export async function writePaymentSettings(
  db: Db,
  input: Partial<PaymentSettings>,
  updatedBy: string
): Promise<PaymentSettings> {
  const now = new Date().toISOString();
  const stringEntries = (Object.entries(STRING_KEYS) as [PaymentStringKey, string][]).filter(
    ([field]) => input[field] !== undefined
  );

  const statements = stringEntries.map(([field, key]) => {
    const value = (input[field] ?? "").trim();
    return db
      .insert(appSettings)
      .values({ key, value, updatedAt: now, updatedBy })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: now, updatedBy } });
  });

  if (input.paddleSandbox !== undefined) {
    const value = input.paddleSandbox ? "true" : "false";
    statements.push(
      db
        .insert(appSettings)
        .values({ key: PADDLE_SANDBOX_KEY, value, updatedAt: now, updatedBy })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value, updatedAt: now, updatedBy },
        })
    );
  }

  if (statements.length > 0) {
    // One batch, not a sequence of awaited statements. Bank details and
    // gateway keys are a single setting — written one at a time a read
    // landing mid-sequence sees a half-configured account. Batching them
    // means a reader sees the old set or the new one, never a mixture.
    await db.batch(statements as unknown as Parameters<Db["batch"]>[0]);
  }

  return readPaymentSettings(db);
}
