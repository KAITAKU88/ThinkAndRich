import type { CreditWallet } from "@/lib/types";

/** Gift credits issued each calendar day (UTC), unused remainder discarded. */
export const GIFT_DAILY_GRANT = 5;
/** Monthly cap on gift credits issued — grant stops until the next month. */
export const GIFT_MONTHLY_CAP = 30;
/** Paid-balance term: every purchase resets the whole paid balance to this many days. */
export const PAID_TERM_DAYS = 365;

export function utcDateString(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function utcMonthString(now: Date): string {
  return now.toISOString().slice(0, 7);
}

export function addDaysIso(from: Date, days: number): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

export function emptyWallet(): CreditWallet {
  return {
    paidCreditBalance: 0,
    paidCreditExpiresAt: null,
    giftCreditBalance: 0,
    giftCreditDate: null,
    giftGrantedThisMonth: 0,
    giftMonth: null,
  };
}

export function isPaidExpired(wallet: Pick<CreditWallet, "paidCreditExpiresAt">, now: Date): boolean {
  if (!wallet.paidCreditExpiresAt) return true;
  return new Date(wallet.paidCreditExpiresAt).getTime() <= now.getTime();
}

export function effectivePaidBalance(wallet: CreditWallet, now: Date): number {
  if (isPaidExpired(wallet, now)) return 0;
  return Math.max(0, wallet.paidCreditBalance);
}

/**
 * Apply daily gift grant + monthly cap + paid expiry, without mutating.
 * Gift leftover from a previous day is discarded (no rollover).
 */
export function refreshWallet(wallet: CreditWallet, now: Date): CreditWallet {
  const today = utcDateString(now);
  const month = utcMonthString(now);

  let giftGrantedThisMonth = wallet.giftGrantedThisMonth;
  let giftMonth = wallet.giftMonth;
  if (giftMonth !== month) {
    giftGrantedThisMonth = 0;
    giftMonth = month;
  }

  let giftCreditBalance = wallet.giftCreditBalance;
  let giftCreditDate = wallet.giftCreditDate;
  if (giftCreditDate !== today) {
    const remainingCap = Math.max(0, GIFT_MONTHLY_CAP - giftGrantedThisMonth);
    const grant = Math.min(GIFT_DAILY_GRANT, remainingCap);
    giftCreditBalance = grant;
    giftGrantedThisMonth += grant;
    giftCreditDate = today;
  }

  const paidExpired = isPaidExpired(wallet, now);
  return {
    paidCreditBalance: paidExpired ? 0 : Math.max(0, wallet.paidCreditBalance),
    paidCreditExpiresAt: wallet.paidCreditExpiresAt,
    giftCreditBalance,
    giftCreditDate,
    giftGrantedThisMonth,
    giftMonth,
  };
}

export function totalAvailable(wallet: CreditWallet, now: Date): number {
  const refreshed = refreshWallet(wallet, now);
  return refreshed.giftCreditBalance + refreshed.paidCreditBalance;
}

export interface DeductResult {
  ok: true;
  wallet: CreditWallet;
  giftSpent: number;
  paidSpent: number;
}

export interface DeductShortfall {
  ok: false;
  shortfall: number;
  available: number;
  wallet: CreditWallet;
}

/**
 * Spend `cost` credits, gift first then paid. Caller must persist the
 * returned wallet. A cost of 0 is a no-op success.
 */
export function deductCredits(
  wallet: CreditWallet,
  cost: number,
  now: Date
): DeductResult | DeductShortfall {
  const refreshed = refreshWallet(wallet, now);
  if (!Number.isInteger(cost) || cost < 0) {
    throw new RangeError("deductCredits: cost must be a non-negative integer");
  }
  if (cost === 0) {
    return { ok: true, wallet: refreshed, giftSpent: 0, paidSpent: 0 };
  }

  const available = refreshed.giftCreditBalance + refreshed.paidCreditBalance;
  if (available < cost) {
    return { ok: false, shortfall: cost - available, available, wallet: refreshed };
  }

  const giftSpent = Math.min(refreshed.giftCreditBalance, cost);
  const paidSpent = cost - giftSpent;
  return {
    ok: true,
    giftSpent,
    paidSpent,
    wallet: {
      ...refreshed,
      giftCreditBalance: refreshed.giftCreditBalance - giftSpent,
      paidCreditBalance: refreshed.paidCreditBalance - paidSpent,
    },
  };
}

/** Add purchased credits and reset the paid term to 365 days from now. */
export function applyPurchase(wallet: CreditWallet, credits: number, now: Date): CreditWallet {
  if (!Number.isInteger(credits) || credits <= 0) {
    throw new RangeError("applyPurchase: credits must be a positive integer");
  }
  const refreshed = refreshWallet(wallet, now);
  return {
    ...refreshed,
    paidCreditBalance: refreshed.paidCreditBalance + credits,
    paidCreditExpiresAt: addDaysIso(now, PAID_TERM_DAYS),
  };
}

/** Start of the current 365-day paid term, or null if none is active. */
export function currentTermStartedAt(wallet: Pick<CreditWallet, "paidCreditExpiresAt">, now: Date): Date | null {
  if (!wallet.paidCreditExpiresAt) return null;
  const expires = new Date(wallet.paidCreditExpiresAt);
  if (expires.getTime() <= now.getTime()) return null;
  return new Date(expires.getTime() - PAID_TERM_DAYS * 86_400_000);
}

export function daysUntilExpiry(wallet: Pick<CreditWallet, "paidCreditExpiresAt">, now: Date): number | null {
  if (isPaidExpired(wallet, now)) return null;
  const expires = new Date(wallet.paidCreditExpiresAt!);
  return Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / 86_400_000));
}

export function walletFromUserRow(row: {
  paidCreditBalance: number;
  paidCreditExpiresAt: string | null;
  giftCreditBalance: number;
  giftCreditDate: string | null;
  giftGrantedThisMonth: number;
  giftMonth: string | null;
}): CreditWallet {
  return {
    paidCreditBalance: row.paidCreditBalance,
    paidCreditExpiresAt: row.paidCreditExpiresAt,
    giftCreditBalance: row.giftCreditBalance,
    giftCreditDate: row.giftCreditDate,
    giftGrantedThisMonth: row.giftGrantedThisMonth,
    giftMonth: row.giftMonth,
  };
}

export function walletToUserPatch(wallet: CreditWallet) {
  return {
    paidCreditBalance: wallet.paidCreditBalance,
    paidCreditExpiresAt: wallet.paidCreditExpiresAt,
    giftCreditBalance: wallet.giftCreditBalance,
    giftCreditDate: wallet.giftCreditDate,
    giftGrantedThisMonth: wallet.giftGrantedThisMonth,
    giftMonth: wallet.giftMonth,
  };
}
