export type Role = "USER" | "ADMIN";
export type SubscriptionTier = "FREE" | "PREMIUM" | "SUPER";
export type IdeaStatus = "DRAFT" | "PUBLISHED";
export type AccessLevel = "free" | "premium" | "super";

export interface Idea {
  id: string;
  title: string;
  shortDescription: string;
  fullContent: string;
  thumbnailUrl: string;
  category: string;
  status: IdeaStatus;
  /** Super-only ideas (Blueprint isPremiumOnly) */
  isPremiumOnly: boolean;
  /** Successful ideas unlocked by Premium+ */
  requiresPremium: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  views: number;
  location: string;
  createdAt: string;
  isTrending?: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  subscriptionTier: SubscriptionTier;
}

export interface AppSettings {
  brandName: string;
  primaryColor: string;
  seoDefaultTitle: string;
}

export interface PlanInfo {
  id: SubscriptionTier;
  name: string;
  priceVnd: number;
  priceLabel: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}
