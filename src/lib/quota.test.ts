import { describe, it, expect } from "vitest";
import { TIER_QUOTAS, quotaForTier, countsTowardQuota } from "./quota";

// The allowance ladder, pinned.
//
// This replaced a single counter that ran across every level a member could
// reach, which let a PLUS subscriber exhaust the day on FREE articles without
// opening a PLUS one. The rule now is that a tier meters only the level it
// just unlocked; everything below it is unlimited. These cases exist so that
// invariant survives future edits to the numbers — the numbers themselves are
// meant to change, the shape is not.

describe("quotaForTier", () => {
  it("meters FREE readers on FREE articles only", () => {
    expect(quotaForTier({ tier: "FREE" })?.level).toBe("FREE");
  });

  it("meters PLUS readers on PLUS articles only", () => {
    expect(quotaForTier({ tier: "PLUS" })?.level).toBe("MEMBER_PLUS");
  });

  it("does not meter PRO readers at all", () => {
    expect(quotaForTier({ tier: "PRO" })).toBeNull();
  });

  it("does not meter admins", () => {
    expect(quotaForTier({ role: "ADMIN", tier: "FREE" })).toBeNull();
  });

  it("treats a signed-out or unknown reader as FREE", () => {
    expect(quotaForTier(null)?.level).toBe("FREE");
    expect(quotaForTier({ tier: "NONSENSE" })?.level).toBe("FREE");
  });
});

describe("countsTowardQuota", () => {
  const free = TIER_QUOTAS.FREE;
  const plus = TIER_QUOTAS.PLUS;

  it("never charges an OPEN article to anyone", () => {
    expect(countsTowardQuota(free, "OPEN")).toBe(false);
    expect(countsTowardQuota(plus, "OPEN")).toBe(false);
    expect(countsTowardQuota(null, "OPEN")).toBe(false);
  });

  it("charges a FREE reader for FREE articles", () => {
    expect(countsTowardQuota(free, "FREE")).toBe(true);
  });

  it("lets a PLUS reader read FREE articles without charge", () => {
    expect(countsTowardQuota(plus, "FREE")).toBe(false);
  });

  it("charges a PLUS reader for PLUS articles", () => {
    expect(countsTowardQuota(plus, "MEMBER_PLUS")).toBe(true);
  });

  it("charges nothing when the tier is unmetered", () => {
    for (const level of ["OPEN", "FREE", "MEMBER_PLUS", "MEMBER_PRO"] as const) {
      expect(countsTowardQuota(null, level)).toBe(false);
    }
  });
});

describe("the allowances themselves", () => {
  it("gives every metered tier a positive limit", () => {
    for (const quota of Object.values(TIER_QUOTAS)) {
      if (quota) expect(quota.limit).toBeGreaterThan(0);
    }
  });

  it("never meters two tiers on the same level", () => {
    const levels = Object.values(TIER_QUOTAS).filter(Boolean).map((q) => q!.level);
    expect(new Set(levels).size).toBe(levels.length);
  });
});
