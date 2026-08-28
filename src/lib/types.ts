export type Role = "USER" | "ADMIN";

export type PillarType = "MENTAL_MODEL" | "BUSINESS_STRATEGY" | "STARTUP_IDEA";

export type CardDisplaySize = "SQUARE_SM" | "SQUARE_MD" | "SQUARE_LG";

/** Credits charged to unlock a post. 0 = Open (no login). */
export type CreditCost = 0 | 1 | 2 | 3 | 4 | 5;

export type CreditPackageId = "pack_1" | "pack_2" | "pack_3";

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

  creditCost: CreditCost;
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
  featured?: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  post?: Post;
}

export interface CreditWallet {
  paidCreditBalance: number;
  paidCreditExpiresAt: string | null;
  giftCreditBalance: number;
  giftCreditDate: string | null;
  giftGrantedThisMonth: number;
  giftMonth: string | null;
}

export interface UserRecord extends CreditWallet {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  countryCode?: string;
  preferredLang?: string;
  createdAt: string;
  lastLoginAt: string;
  readPosts: string[];
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
  countryCode?: string;
  preferredLang?: string;
  paidCreditBalance: number;
  paidCreditExpiresAt: string | null;
  giftCreditBalance: number;
  giftGrantedThisMonth: number;
  /** Gift + unexpired paid, after the daily grant has been applied. */
  totalCredits: number;
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

export type PaymentGateway = "sepay" | "paddle";

export type CurrencyCode =
  | "VND"
  | "USD"
  | "EUR"
  | "JPY"
  | "KRW"
  | "TWD"
  | "CNY";

export interface PackagePrice {
  price: number;
  formatted: string;
}

export interface MarketPricing {
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  currency: CurrencyCode;
  currencySymbol: string;
  gateway: PaymentGateway;
  pppMultiplier: number;
  packages: Record<CreditPackageId, PackagePrice>;
}

export interface UsageSnapshot {
  paidBalance: number;
  paidExpiresAt: string | null;
  daysRemaining: number | null;
  giftRemainingToday: number;
  giftGrantedThisMonth: number;
  giftMonthlyCap: number;
  creditsSpentThisTerm: number;
  unlockedCount: number;
}
