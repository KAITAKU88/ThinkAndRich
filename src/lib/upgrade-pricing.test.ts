import { describe, it, expect } from "vitest";
import type { CurrencyCode } from "./types";
import {
  DAYS_PER_MONTH,
  TERM_MONTHS,
  calculateUpgradeTopUp,
  consumedFraction,
  roundToCurrency,
} from "./upgrade-pricing";

// The base market, from PPP_PRICING_MAP.
const PLUS_VND = 299_000;
const PRO_VND = 499_000;

const START = new Date("2026-01-01T00:00:00.000Z");

/** The upgrade moment, `days` whole days after the PLUS term started. */
function after(days: number): Date {
  return new Date(START.getTime() + days * 86_400_000);
}

function quote(
  days: number,
  pricePlus = PLUS_VND,
  pricePro = PRO_VND,
  currency: CurrencyCode = "VND"
) {
  return calculateUpgradeTopUp(pricePlus, pricePro, START, after(days), currency);
}

describe("consumedFraction — the M(x) curve", () => {
  it("starts a shade above zero, as the fit dictates", () => {
    expect(consumedFraction(0)).toBeCloseTo(0.01575, 5);
  });

  it("reaches a fully spent term at twelve months", () => {
    expect(consumedFraction(TERM_MONTHS)).toBeCloseTo(0.99992, 5);
  });

  it("front-loads consumption, which is the whole point of the curve", () => {
    // Half the term gone costs far more than half the value — that is what
    // stops a short PLUS term being used as a cheap route into PRO.
    expect(consumedFraction(6)).toBeGreaterThan(0.5);
    expect(consumedFraction(6)).toBeCloseTo(0.7333, 4);
  });

  it("never decreases across the term", () => {
    let previous = -1;
    for (let x = 0; x <= TERM_MONTHS; x += 0.25) {
      const current = consumedFraction(x);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  // The polynomial turns over at x ≈ 12.55 and goes negative from x ≈ 25.6.
  // Clamping only the output would read that as "nothing consumed" and hand
  // a two-year-old term back at full value.
  it("treats anything past the term as fully spent", () => {
    const atTerm = consumedFraction(TERM_MONTHS);
    for (const months of [12.5, 13, 20, 26, 40, 120]) {
      expect(consumedFraction(months)).toBe(atTerm);
    }
  });

  it("clamps a negative age to the start of the curve", () => {
    expect(consumedFraction(-5)).toBe(consumedFraction(0));
  });

  it("treats a non-finite age as a spent term rather than a free one", () => {
    expect(consumedFraction(Number.NaN)).toBe(1);
    expect(consumedFraction(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

// The cases named in the brief, checked against the arithmetic rather than
// against the implementation: M(x) computed by hand, then
// spent = plus·M, credit = plus − spent, top-up = pro − credit.
describe("calculateUpgradeTopUp — the cases from the brief", () => {
  const cases = [
    { label: "17 days", days: 17, spentValue: 30_390, remainingCredit: 268_610, topUpAmount: 230_390 },
    { label: "31 days", days: 31, spentValue: 50_660, remainingCredit: 248_340, topUpAmount: 250_660 },
    { label: "1 month", days: 30, spentValue: 49_239, remainingCredit: 249_761, topUpAmount: 249_239 },
    { label: "6 months", days: 182, spentValue: 218_857, remainingCredit: 80_143, topUpAmount: 418_857 },
    { label: "11 months", days: 334, spentValue: 294_942, remainingCredit: 4_058, topUpAmount: 494_942 },
    // 365 days is 12.0003 average months, so this row is the input clamp
    // taking effect: the curve is evaluated at exactly 12, not past it.
    { label: "12 months", days: 365, spentValue: 298_975, remainingCredit: 25, topUpAmount: 498_975 },
  ];

  for (const { label, days, spentValue, remainingCredit, topUpAmount } of cases) {
    it(`${label} in`, () => {
      const result = quote(days);
      expect(result.daysUsed).toBe(days);
      expect(result.monthsUsed).toBeCloseTo(days / DAYS_PER_MONTH, 6);
      expect(result.spentValue).toBe(spentValue);
      expect(result.remainingCredit).toBe(remainingCredit);
      expect(result.topUpAmount).toBe(topUpAmount);
    });
  }

  it("costs more the longer PLUS has been held", () => {
    const amounts = [0, 17, 30, 31, 182, 334, 365].map((days) => quote(days).topUpAmount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThan(amounts[i - 1]);
    }
  });

  it("never charges more than the full PRO price", () => {
    for (const days of [0, 17, 182, 365, 900]) {
      expect(quote(days).topUpAmount).toBeLessThanOrEqual(PRO_VND);
    }
  });
});

describe("calculateUpgradeTopUp — the breakdown holds together", () => {
  it("splits the PLUS price exactly between spent and remaining", () => {
    for (const days of [0, 17, 31, 182, 334, 365]) {
      const { spentValue, remainingCredit } = quote(days);
      expect(spentValue + remainingCredit).toBe(PLUS_VND);
    }
  });

  it("charges the PRO price less the credit", () => {
    for (const days of [0, 17, 182, 365]) {
      const { remainingCredit, topUpAmount } = quote(days);
      expect(topUpAmount).toBe(PRO_VND - remainingCredit);
    }
  });

  it("ends the new term one year from the upgrade, not from the PLUS start", () => {
    const upgradeMoment = after(182);
    const { expiresAt } = quote(182);
    expect(expiresAt.getTime() - upgradeMoment.getTime()).toBe(365 * 86_400_000);
  });
});

describe("calculateUpgradeTopUp — edges", () => {
  it("charges almost the full PRO price on day zero", () => {
    // Not the whole price: M(0) is 0.01575, so a same-day upgrade still
    // forfeits a sliver. That is the fit, not a rounding artefact.
    const { topUpAmount, spentValue } = quote(0);
    expect(spentValue).toBe(4_709);
    expect(topUpAmount).toBe(PRO_VND - (PLUS_VND - 4_709));
  });

  it("stops giving credit back once the term is over", () => {
    const atTerm = quote(365);
    for (const days of [366, 400, 800, 3_000]) {
      expect(quote(days).topUpAmount).toBe(atTerm.topUpAmount);
    }
  });

  it("treats an upgrade dated before the start as day zero", () => {
    const backwards = calculateUpgradeTopUp(PLUS_VND, PRO_VND, START, after(-40));
    expect(backwards.daysUsed).toBe(0);
    expect(backwards.topUpAmount).toBe(quote(0).topUpAmount);
  });

  it("never charges a negative amount when the credit exceeds the PRO price", () => {
    // A market where PRO sits barely above PLUS, upgraded on day one.
    const { topUpAmount, remainingCredit } = calculateUpgradeTopUp(100, 60, START, after(1));
    expect(remainingCredit).toBeGreaterThan(60);
    expect(topUpAmount).toBe(0);
  });

  it("handles a free PLUS term without dividing by anything", () => {
    const { remainingCredit, topUpAmount } = calculateUpgradeTopUp(0, PRO_VND, START, after(17));
    expect(remainingCredit).toBe(0);
    expect(topUpAmount).toBe(PRO_VND);
  });

  it("accepts ISO strings and epoch numbers, like the records it reads from", () => {
    const fromDates = quote(182);
    const fromStrings = calculateUpgradeTopUp(
      PLUS_VND,
      PRO_VND,
      START.toISOString(),
      after(182).toISOString()
    );
    const fromNumbers = calculateUpgradeTopUp(
      PLUS_VND,
      PRO_VND,
      START.getTime(),
      after(182).getTime()
    );
    expect(fromStrings.topUpAmount).toBe(fromDates.topUpAmount);
    expect(fromNumbers.topUpAmount).toBe(fromDates.topUpAmount);
  });

  it("refuses input it cannot price rather than inventing a number", () => {
    expect(() => calculateUpgradeTopUp(PLUS_VND, PRO_VND, "not a date", after(1))).toThrow(RangeError);
    expect(() => calculateUpgradeTopUp(Number.NaN, PRO_VND, START, after(1))).toThrow(RangeError);
    expect(() => calculateUpgradeTopUp(-1, PRO_VND, START, after(1))).toThrow(RangeError);
  });
});

describe("calculateUpgradeTopUp — every currency the pricing table quotes", () => {
  // Same curve, same day, different markets: the amounts stay whole units of
  // whatever currency was passed, because that is what orders.amount holds.
  const markets = [
    { currency: "VND" as const, plus: 299_000, pro: 499_000, topUpAt182: 418_857 },
    { currency: "USD" as const, plus: 49, pro: 89, topUpAt182: 76 },
    { currency: "EUR" as const, plus: 39, pro: 75, topUpAt182: 65 },
  ];

  for (const { currency, plus, pro, topUpAt182 } of markets) {
    it(`prices a six-month-old ${currency} term`, () => {
      const result = quote(182, plus, pro, currency);
      expect(result.currency).toBe(currency);
      expect(result.topUpAmount).toBe(topUpAt182);
      expect(Number.isInteger(result.topUpAmount)).toBe(true);
      expect(Number.isInteger(result.spentValue)).toBe(true);
    });
  }
});

describe("roundToCurrency", () => {
  it("rounds half away from zero, the way money is quoted", () => {
    expect(roundToCurrency(0.5, "USD")).toBe(1);
    expect(roundToCurrency(1.5, "USD")).toBe(2);
    expect(roundToCurrency(2.5, "USD")).toBe(3); // Math.round gives 3 here too
    expect(roundToCurrency(-0.5, "USD")).toBe(-1); // ...but -0 here, which is why this exists
    expect(roundToCurrency(-1.5, "USD")).toBe(-2);
  });

  it("leaves whole amounts alone", () => {
    expect(roundToCurrency(299_000, "VND")).toBe(299_000);
    expect(roundToCurrency(0, "JPY")).toBe(0);
  });
});
