import type { ContentAccessLevel, MembershipTier } from "@/lib/types";

/**
 * Daily reading allowances.
 *
 * A tier's allowance applies only to the level that tier just unlocked.
 * Everything below it is unlimited:
 *
 *   OPEN   no account needed, never limited, never counted
 *   FREE   sign in; 5 FREE articles a day; OPEN unlimited
 *   PLUS   10 PLUS articles a day; FREE and OPEN unlimited
 *   PRO    unlimited everywhere
 *
 * The earlier design ran one counter across every level a member could
 * reach, which meant a PLUS subscriber could spend the whole day's
 * allowance on FREE articles and never open a PLUS one — paying for a tier
 * bought a larger number rather than access to the tier itself. Scoping each
 * allowance to its own level makes the ladder mean something: upgrading
 * removes the limit you were hitting instead of raising it.
 *
 * These are the only numbers to edit when the allowances change; the server
 * gate, the counter shown to readers and the pricing copy all read from here.
 */
export interface TierQuota {
  /** The access level this allowance meters. Reads at other levels are free. */
  level: ContentAccessLevel;
  limit: number;
}

export const TIER_QUOTAS: Record<MembershipTier, TierQuota | null> = {
  FREE: { level: "FREE", limit: 5 },
  PLUS: { level: "MEMBER_PLUS", limit: 10 },
  PRO: null, // unlimited
};

/**
 * null means this tier is not metered at all.
 *
 * An unrecognised tier falls back to the strictest allowance rather than to
 * none — but that fallback has to be told apart from PRO, whose entry is
 * legitimately null. Writing this as `TIER_QUOTAS[tier] ?? TIER_QUOTAS.FREE`
 * swallows PRO's null and hands a paying PRO subscriber the FREE allowance.
 */
export function quotaForTier(user: { role?: string; tier?: string } | null): TierQuota | null {
  if (!user) return TIER_QUOTAS.FREE;
  if (user.role === "ADMIN") return null;
  const tier = user.tier as MembershipTier;
  return tier in TIER_QUOTAS ? TIER_QUOTAS[tier] : TIER_QUOTAS.FREE;
}

/** Whether reading a post at this level draws on the given tier's allowance. */
export function countsTowardQuota(quota: TierQuota | null, level: ContentAccessLevel): boolean {
  return quota !== null && level === quota.level;
}
