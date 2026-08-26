import type { CurrencyCode } from "./types";

/**
 * What a PLUS member pays to move to PRO mid-term.
 *
 * The model is "proration with a new cycle": the PLUS term ends at the
 * moment of the upgrade, a fresh one-year PRO term starts there, and the
 * unspent part of PLUS comes off the PRO price. The member never loses the
 * money they have not used, and never gets a partial PRO year.
 *
 * The unspent part is not linear in time. A linear split would make a
 * one-month PLUS term a cheap trial: pay a twelfth of PLUS, upgrade, and
 * carry eleven twelfths onto a full PRO year. The curve below front-loads
 * consumption instead, so the first months cost more than their share and
 * the arbitrage disappears.
 *
 * Everything here is a pure function of prices and dates, in the same
 * display units the pricing table uses (299000 for ₫299.000, 49 for $49 —
 * see PPP_PRICING_MAP), so it works for every currency without a conversion
 * step and can be tested without a database.
 */

/** The curve is only defined across a term; a term is twelve months. */
export const TERM_MONTHS = 12;

/**
 * Fraction of the PLUS term's value consumed after `x` months.
 *
 *   M(x) = -0.006263x² + 0.15717x + 0.01575
 *
 * Fitted so that M(12) ≈ 1: the term is exactly used up at its end. The
 * parabola's vertex sits at x ≈ 12.55, so M rises across the whole 0–12
 * domain — value is never regained by waiting.
 *
 * Past the vertex it turns over, and that is why the input is clamped and
 * not just the output. M(20) ≈ 0.65, and from x ≈ 25.6 the polynomial goes
 * negative; clamping only the result to [0, 1] would read that as "nothing
 * consumed" and hand a two-year-old PLUS term back at full value. Holding
 * PLUS for longer can never make it worth more, so anything at or past the
 * end of the term counts as a term fully spent.
 */
export function consumedFraction(monthsUsed: number): number {
  if (!Number.isFinite(monthsUsed)) return 1;
  const x = clamp(monthsUsed, 0, TERM_MONTHS);
  const raw = -0.006263 * x * x + 0.15717 * x + 0.01575;
  return clamp(raw, 0, 1);
}

/** Days in an average month, so `days_used / 30.416` gives months. */
export const DAYS_PER_MONTH = 30.416;

export const UPGRADE_TERM_DAYS = 365;

export interface UpgradeQuote {
  /** Whole days elapsed since the PLUS term started. Never negative. */
  daysUsed: number;
  /** `daysUsed` expressed in average months — the curve's input. */
  monthsUsed: number;
  /** M(x): the share of the PLUS term already consumed, in [0, 1]. */
  consumedFraction: number;
  /** Value of PLUS already used up, rounded to the currency. */
  spentValue: number;
  /** What the member still holds in PLUS, rounded to the currency. */
  remainingCredit: number;
  /** What they pay today. Never negative — see below. */
  topUpAmount: number;
  /** When the new PRO term ends: one year from the upgrade. */
  expiresAt: Date;
  currency: CurrencyCode;
}

/**
 * @param pricePlus  Full one-year PLUS price, in display units.
 * @param pricePro   Full one-year PRO price, in display units.
 * @param startDate  When the member's PLUS term began.
 * @param upgradeDate When they are upgrading — normally now.
 * @param currency   Decides how the amounts are rounded.
 */
export function calculateUpgradeTopUp(
  pricePlus: number,
  pricePro: number,
  startDate: Date | string | number,
  upgradeDate: Date | string | number,
  currency: CurrencyCode = "VND"
): UpgradeQuote {
  const start = toDate(startDate);
  const upgrade = toDate(upgradeDate);

  if (!isValidPrice(pricePlus) || !isValidPrice(pricePro)) {
    throw new RangeError("calculateUpgradeTopUp: prices must be finite and not negative");
  }
  if (!start || !upgrade) {
    throw new RangeError("calculateUpgradeTopUp: startDate and upgradeDate must be valid dates");
  }

  // A clock skew or a mis-stamped record must not hand out more credit than
  // the member ever paid for, so an upgrade "before" the start counts as day
  // zero rather than as negative time.
  const elapsedMs = Math.max(0, upgrade.getTime() - start.getTime());
  const daysUsed = Math.floor(elapsedMs / 86_400_000);
  const monthsUsed = daysUsed / DAYS_PER_MONTH;

  const consumed = consumedFraction(monthsUsed);
  const spentValue = roundToCurrency(pricePlus * consumed, currency);

  // Derive the credit from the rounded spend rather than rounding it
  // separately, or the two can disagree by a minor unit and the modal shows
  // a breakdown that does not add up.
  const remainingCredit = clamp(pricePlus - spentValue, 0, pricePlus);

  // PRO can be cheaper than what PLUS is still worth — a long-held PLUS term
  // in a market where the two prices sit close together. The upgrade is
  // still allowed; it just costs nothing. Refunding the difference is a
  // policy question, not an arithmetic one, so the surplus is dropped here
  // and the caller charges zero.
  const topUpAmount = Math.max(0, roundToCurrency(pricePro - remainingCredit, currency));

  return {
    daysUsed,
    monthsUsed,
    consumedFraction: consumed,
    spentValue,
    remainingCredit,
    topUpAmount,
    expiresAt: addDays(upgrade, UPGRADE_TERM_DAYS),
    currency,
  };
}

/**
 * Minor units per currency.
 *
 * Note this is only half the story here: `orders.amount` is an INTEGER
 * column holding display units, so a currency with subunits cannot store a
 * fractional charge. Everything the pricing table quotes is a whole unit
 * already ($49, €39, ₫299.000), so amounts are rounded to whole units and
 * the map exists to make that a stated decision rather than an accident. If
 * subunit charges are ever needed, this is the one place to change, plus the
 * column.
 */
const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  VND: 0,
  USD: 0,
  EUR: 0,
  JPY: 0,
  KRW: 0,
  TWD: 0,
  CNY: 0,
};

/**
 * Round half away from zero, which is what people expect of money and what
 * JavaScript's Math.round does not do for negatives.
 */
export function roundToCurrency(amount: number, currency: CurrencyCode): number {
  const decimals = CURRENCY_DECIMALS[currency] ?? 0;
  const factor = 10 ** decimals;
  const scaled = amount * factor;
  return (scaled < 0 ? -Math.round(-scaled) : Math.round(scaled)) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}
