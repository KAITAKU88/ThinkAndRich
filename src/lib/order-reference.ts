/**
 * The code a customer types, or has typed for them, into a bank transfer.
 *
 * It used to be the order id itself — `ord_` plus a UUID, forty characters
 * of underscores and hyphens. That travels badly: a Vietnamese bank puts the
 * VietQR `addInfo` string through its own transfer-content field, which
 * normalises punctuation and caps length, and the webhook matched on the
 * underscore surviving. If it did not, the money arrived and the order sat
 * PENDING forever with nothing linking the two.
 *
 * So the reference is short, has no punctuation to lose, and is read back
 * out of whatever the bank hands over rather than out of an exact string.
 */

/**
 * No 0/O and no 1/I/L: this gets read off a screen and typed by hand often
 * enough that the pairs people confuse are worth simply not using.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const PREFIX = "TNR";
const BODY_LENGTH = 8;

/** e.g. "TNR7K2M9XB" — 11 characters, all unambiguous. */
export function generateOrderReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BODY_LENGTH));
  let body = "";
  for (const byte of bytes) body += ALPHABET[byte % ALPHABET.length];
  return PREFIX + body;
}

/**
 * Pull the reference out of a bank's transfer-content field.
 *
 * Everything that is not a letter or digit is dropped before matching, so
 * the code survives a bank that inserts spaces, strips punctuation, or wraps
 * it in narration of its own ("CHUYEN TIEN TNR7K2M9XB GD 123456"). Case is
 * normalised for the same reason — some banks upper-case the whole field.
 */
export function extractOrderReference(content: string | null | undefined): string | null {
  if (!content) return null;
  const compact = content.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const match = compact.match(new RegExp(`${PREFIX}[${ALPHABET}]{${BODY_LENGTH}}`));
  return match?.[0] ?? null;
}

/** Whether a string is a well-formed reference, for validating input. */
export function isOrderReference(value: string): boolean {
  return new RegExp(`^${PREFIX}[${ALPHABET}]{${BODY_LENGTH}}$`).test(value);
}
