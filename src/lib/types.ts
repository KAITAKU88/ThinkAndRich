export type Role = "USER" | "ADMIN";

export type MembershipTier = "FREE" | "PLUS" | "PRO";

export type PostCategory =
  | "Mô hình Tư duy"
  | "Mô hình Tâm trí"
  | "Chiến lược Kinh doanh"
  | "Tâm lý học & Quyết định"
  | "Hiệu ứng & Định luật";

export type PostStatus = "DRAFT" | "PUBLISHED";

export interface Post {
  id: string;
  slug: string;
  title: string;
  category: PostCategory;
  shortDescription: string;
  fullContent: string;
  thumbnailUrl: string;
  videoUrl?: string; // YouTube / Vimeo embed URL
  author: string;
  readTime: string;
  status: PostStatus;
  views: number;
  likes: number;
  dislikes: number;
  featured?: boolean;
  isMemberOnly?: boolean; // Requires PLUS or PRO tier (paid user)
  isPro?: boolean; // Backward compatibility alias for isMemberOnly
  tags: string[];
  createdAt: string;
  updatedAt: string;
}


export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: MembershipTier;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  dailyReads?: {
    date: string; // YYYY-MM-DD
    count: number;
  };
  readPosts: string[]; // List of post IDs read by this user
  likedPosts: string[];
  dislikedPosts: string[];
}

export interface ReadLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  postId: string;
  postTitle: string;
  postCategory: PostCategory;
  readAt: string;
  reaction?: "like" | "dislike" | "none";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: MembershipTier;
  dailyReads?: {
    date: string; // YYYY-MM-DD
    count: number;
  };
}

export interface OtpSession {
  email: string;
  otpCode: string;
  expiresAt: number;
  createdAt: number;
}

export interface AppSettings {
  brandName: string;
  brandTagline: string;
  primaryColor: string;
  seoDefaultTitle: string;
}

export interface PricingPlan {
  id: MembershipTier;
  name: string;
  tagline: string;
  price: number;
  priceFormatted: string;
  dailyLimitText: string;
  isPopular?: boolean;
  badge?: string;
  psychologyNote?: string;
  features: string[];
  ctaText: string;
}

export type SupportedLanguage =
  | "vi"
  | "en"
  | "zh"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "ru"
  | "pt"
  | "ar"
  | "hi"
  | "id"
  | "th";


export type CountryCode =
  | "VN"
  | "US"
  | "EU"
  | "JP"
  | "KR"
  | "TW"
  | "CN"
  | "DEFAULT";

export type PaymentGateway = "sepay" | "lemonsqueezy";

export type CurrencyCode =
  | "VND"
  | "USD"
  | "EUR"
  | "JPY"
  | "KRW"
  | "TWD"
  | "CNY";

export interface PppPricingConfig {
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  currency: CurrencyCode;
  currencySymbol: string;
  gateway: PaymentGateway;
  pppFactorNote: string;
  plans: {
    FREE: {
      price: number;
      formatted: string;
    };
    PLUS: {
      price: number;
      formatted: string;
    };
    PRO: {
      price: number;
      formatted: string;
    };
  };
}



