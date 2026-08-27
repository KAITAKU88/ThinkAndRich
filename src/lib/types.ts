export type Role = "USER" | "ADMIN";

export type MembershipTier = "FREE" | "PLUS" | "PRO";
export type SubscriptionTier = MembershipTier;

export type PillarType = "MENTAL_MODEL" | "BUSINESS_STRATEGY" | "STARTUP_IDEA";

export type CardDisplaySize = "SQUARE_SM" | "SQUARE_MD" | "SQUARE_LG";

export type ContentAccessLevel = "OPEN" | "FREE" | "MEMBER_PLUS" | "MEMBER_PRO";

export type PostCategory =
  | "Mô hình Tư duy"
  | "Mô hình Tâm trí"
  | "Chiến lược Kinh doanh"
  | "Ý tưởng Khởi nghiệp"
  | "Tâm lý học & Quyết định"
  | "Hào kinh tế & Moats"
  | "Deep-dive Teardown";

export type PostStatus = "DRAFT" | "PUBLISHED";

export interface PillarMetadata {
  id: PillarType;
  titleVi: string;
  titleEn: string;
  taglineVi: string;
  taglineEn: string;
  colorHex: string;
  colorDarkHex: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  iconName: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  pillar: PillarType;
  category: string;
  displaySize: CardDisplaySize;
  
  academicFormula?: string;
  summarySnippet: string;
  fullContent: string;
  schematicSvg?: string;
  keyTakeaways?: string[];

  accessLevel: ContentAccessLevel;
  readingTimeMinutes: number;
  readingTemplate?: string | null;
  status: PostStatus;
  views: number;
  clicks: number;
  shares: number;
  likes: number;
  dislikes: number;
  author: string;
  tags: string[];
  /** Ordered editorial choices rendered below this article (maximum three). */
  relatedPostIds?: string[];
  createdAt: string;
  updatedAt: string;

  // Which language the fields above are actually in, and whether that's a
  // real translation or the Vietnamese original shown as a fallback — set
  // by resolvePostForLanguage() (src/lib/server/post-translation.ts).
  // Optional: absent means "vi, not language-resolved" (e.g. admin routes
  // that always want the canonical row).
  contentLanguage?: SupportedLanguage;
  isTranslated?: boolean;

  // Additional & Backward compatibility fields
  shortDescription?: string;
  readTime?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  isMemberOnly?: boolean;
  isPro?: boolean;
  featured?: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  post?: Post;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: MembershipTier;
  avatar?: string;
  countryCode?: string;
  preferredLang?: string;
  createdAt: string;
  lastLoginAt: string;
  dailyReads?: {
    date: string; // YYYY-MM-DD
    count: number;
  };
  readPosts: string[]; // List of post IDs read by this user
  bookmarkedPosts?: string[];
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
  pillar?: PillarType;
  postCategory?: string;
  readAt: string;
  reaction?: "like" | "dislike" | "none";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: MembershipTier;
  countryCode?: string;
  preferredLang?: string;
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
