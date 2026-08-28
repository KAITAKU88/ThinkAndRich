import { describe, expect, it } from "vitest";
import {
  applyPurchase,
  deductCredits,
  emptyWallet,
  GIFT_DAILY_GRANT,
  GIFT_MONTHLY_CAP,
  PAID_TERM_DAYS,
  refreshWallet,
  totalAvailable,
} from "./credits";

const DAY = "2026-08-28T08:00:00.000Z";
const now = new Date(DAY);

describe("refreshWallet", () => {
  it("grants 5 gift credits on a new day", () => {
    const next = refreshWallet(emptyWallet(), now);
    expect(next.giftCreditBalance).toBe(GIFT_DAILY_GRANT);
    expect(next.giftCreditDate).toBe("2026-08-28");
    expect(next.giftGrantedThisMonth).toBe(GIFT_DAILY_GRANT);
    expect(next.giftMonth).toBe("2026-08");
  });

  it("does not rollover unused gift credits overnight", () => {
    const yesterday = refreshWallet(emptyWallet(), now);
    const leftover = { ...yesterday, giftCreditBalance: 4, giftCreditDate: "2026-08-27" };
    const next = refreshWallet(leftover, now);
    expect(next.giftCreditBalance).toBe(GIFT_DAILY_GRANT);
    expect(next.giftGrantedThisMonth).toBe(10);
  });

  it("stops granting once the monthly cap is reached", () => {
    const capped = {
      ...emptyWallet(),
      giftGrantedThisMonth: GIFT_MONTHLY_CAP,
      giftMonth: "2026-08",
      giftCreditDate: "2026-08-27",
    };
    const next = refreshWallet(capped, now);
    expect(next.giftCreditBalance).toBe(0);
    expect(next.giftGrantedThisMonth).toBe(GIFT_MONTHLY_CAP);
  });

  it("resets the monthly counter on a new month", () => {
    const lastMonth = {
      ...emptyWallet(),
      giftGrantedThisMonth: GIFT_MONTHLY_CAP,
      giftMonth: "2026-07",
      giftCreditDate: "2026-07-31",
    };
    const next = refreshWallet(lastMonth, now);
    expect(next.giftCreditBalance).toBe(GIFT_DAILY_GRANT);
    expect(next.giftGrantedThisMonth).toBe(GIFT_DAILY_GRANT);
    expect(next.giftMonth).toBe("2026-08");
  });

  it("zeros paid balance after expiry without touching unlocks", () => {
    const expired = {
      ...emptyWallet(),
      paidCreditBalance: 1500,
      paidCreditExpiresAt: "2026-08-01T00:00:00.000Z",
    };
    const next = refreshWallet(expired, now);
    expect(next.paidCreditBalance).toBe(0);
    expect(next.paidCreditExpiresAt).toBe(expired.paidCreditExpiresAt);
  });
});

describe("deductCredits", () => {
  it("spends gift before paid", () => {
    const wallet = applyPurchase(emptyWallet(), 1500, now);
    const result = deductCredits(wallet, 7, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.giftSpent).toBe(5);
    expect(result.paidSpent).toBe(2);
    expect(result.wallet.giftCreditBalance).toBe(0);
    expect(result.wallet.paidCreditBalance).toBe(1498);
  });

  it("returns a shortfall instead of going negative", () => {
    const result = deductCredits(emptyWallet(), 8, now);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.available).toBe(GIFT_DAILY_GRANT);
    expect(result.shortfall).toBe(3);
  });

  it("unlock of cost 0 does not spend", () => {
    const result = deductCredits(emptyWallet(), 0, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.giftSpent).toBe(0);
    expect(result.paidSpent).toBe(0);
  });
});

describe("applyPurchase", () => {
  it("adds credits and resets the 365-day term", () => {
    const first = applyPurchase(emptyWallet(), 1500, now);
    expect(first.paidCreditBalance).toBe(1500);
    const later = new Date("2026-09-01T08:00:00.000Z");
    const second = applyPurchase(first, 4500, later);
    expect(second.paidCreditBalance).toBe(6000);
    const expectedExpiry = new Date(later.getTime() + PAID_TERM_DAYS * 86_400_000).toISOString();
    expect(second.paidCreditExpiresAt).toBe(expectedExpiry);
  });
});

describe("totalAvailable", () => {
  it("sums gift and unexpired paid", () => {
    const wallet = applyPurchase(emptyWallet(), 1500, now);
    expect(totalAvailable(wallet, now)).toBe(1500 + GIFT_DAILY_GRANT);
  });
});
