import type { Idea, SessionUser, SubscriptionTier } from "./types";

export function canAccessIdea(
  idea: Idea,
  user: SessionUser | null
): boolean {
  if (idea.isPremiumOnly) {
    return user?.subscriptionTier === "SUPER";
  }
  if (idea.requiresPremium) {
    return (
      user?.subscriptionTier === "PREMIUM" ||
      user?.subscriptionTier === "SUPER"
    );
  }
  return true;
}

export function requiredTier(idea: Idea): SubscriptionTier {
  if (idea.isPremiumOnly) return "SUPER";
  if (idea.requiresPremium) return "PREMIUM";
  return "FREE";
}

export function favoriteLimit(tier: SubscriptionTier | undefined): number {
  if (!tier || tier === "FREE") return 5;
  return Infinity;
}

export function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
