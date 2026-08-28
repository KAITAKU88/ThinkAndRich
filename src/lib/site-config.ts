import { PILLARS_CONFIG } from "@/lib/data";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { GIFT_DAILY_GRANT, GIFT_MONTHLY_CAP, PAID_TERM_DAYS } from "@/lib/credits";
import { SUPPORTED_LANGUAGES_LIST } from "@/lib/i18n/languages";
import type { SupportedLanguage } from "@/lib/types";

export const PILLAR_COUNT = Object.keys(PILLARS_CONFIG).length;
export const LANGUAGE_COUNT = SUPPORTED_LANGUAGES_LIST.length;

export { GIFT_DAILY_GRANT, GIFT_MONTHLY_CAP, PAID_TERM_DAYS };

const PACKAGE_CREDIT_NUMBERS = CREDIT_PACKAGES.map((pack) => pack.credits);

function localeTag(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return "vi-VN";
    case "zh":
      return "zh-CN";
    case "pt":
      return "pt-BR";
    default:
      return language;
  }
}

function formatCredits(value: number, language: SupportedLanguage): string {
  return value.toLocaleString(localeTag(language));
}

/** e.g. "1.500, 4.500 và 10.000" (vi) or "1,500, 4,500, and 10,000" (en). */
export function formatPackageCreditsList(language: SupportedLanguage): string {
  const formatted = PACKAGE_CREDIT_NUMBERS.map((n) => formatCredits(n, language));
  if (language === "vi") {
    if (formatted.length <= 1) return formatted[0] ?? "";
    return `${formatted.slice(0, -1).join(", ")} và ${formatted.at(-1)}`;
  }
  if (language === "zh") {
    return formatted.join("、");
  }
  if (formatted.length <= 1) return formatted[0] ?? "";
  return `${formatted.slice(0, -1).join(", ")}, and ${formatted.at(-1)}`;
}

export function paidTermDaysLabel(language: SupportedLanguage): string {
  const n = String(PAID_TERM_DAYS);
  switch (language) {
    case "vi":
      return `${n} ngày`;
    case "zh":
      return `${n} 天`;
    case "ja":
      return `${n}日`;
    case "ko":
      return `${n}일`;
    case "fr":
      return `${n} jours`;
    case "de":
      return `${n} Tage`;
    case "es":
    case "pt":
      return `${n} días`;
    case "ru":
      return `${n} дней`;
    case "ar":
      return `${n} يوماً`;
    case "hi":
      return `${n} दिन`;
    case "id":
      return `${n} hari`;
    case "th":
      return `${n} วัน`;
    default:
      return `${n} days`;
  }
}

/** Short phrase for pricing cards: "Hạn {n} ngày từ lần mua gần nhất". */
export function paidTermExpiryPhrase(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Hạn ${PAID_TERM_DAYS} ngày từ lần mua gần nhất`;
    case "zh":
      return `自最近一次购买起 ${PAID_TERM_DAYS} 天有效`;
    case "en":
    default:
      return `Valid for ${PAID_TERM_DAYS} days from your most recent purchase`;
  }
}

export function paidTermPurchasePhrase(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Hạn ${PAID_TERM_DAYS} ngày kể từ lần mua`;
    case "zh":
      return `自购买起 ${PAID_TERM_DAYS} 天有效`;
    case "en":
    default:
      return `Valid for ${PAID_TERM_DAYS} days from purchase`;
  }
}

export function paidTermStackPhrase(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Mọi lần mua cộng dồn và gia hạn ${PAID_TERM_DAYS} ngày cho toàn bộ số dư.`;
    case "zh":
      return `每次购买累加余额，并将全部余额有效期重置为 ${PAID_TERM_DAYS} 天。`;
    case "en":
    default:
      return `Every purchase stacks and resets the ${PAID_TERM_DAYS}-day term on the whole balance.`;
  }
}

export function giftGrantPhrase(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `${GIFT_DAILY_GRANT} credit tặng mỗi ngày (trần ${GIFT_MONTHLY_CAP}/tháng)`;
    case "zh":
      return `每日赠送 ${GIFT_DAILY_GRANT} 点（每月上限 ${GIFT_MONTHLY_CAP}）`;
    case "en":
    default:
      return `${GIFT_DAILY_GRANT} gift credits per day (cap ${GIFT_MONTHLY_CAP}/month)`;
  }
}

export function paidTermUsagePeriodLabel(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Đã dùng trong kỳ ${PAID_TERM_DAYS} ngày`;
    case "zh":
      return `本 ${PAID_TERM_DAYS} 天周期内已用`;
    case "en":
    default:
      return `Used in the ${PAID_TERM_DAYS}-day term`;
  }
}

/** Card footnote on /pricing and home teaser. */
export function paidTermPricingCardNote(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Cộng dồn vào số dư. Hạn dùng ${PAID_TERM_DAYS} ngày kể từ lần mua gần nhất.`;
    case "zh":
      return `点数累加到余额，自最近一次购买起 ${PAID_TERM_DAYS} 天有效。`;
    case "en":
    default:
      return `Credits stack on your balance. Valid for ${PAID_TERM_DAYS} days from your most recent purchase.`;
  }
}

export function paidTermCheckoutSummary(language: SupportedLanguage): string {
  switch (language) {
    case "vi":
      return `Cộng dồn vào số dư. Hạn dùng ${PAID_TERM_DAYS} ngày kể từ lần mua này.`;
    case "zh":
      return `点数累加到余额，自本次购买起 ${PAID_TERM_DAYS} 天有效。`;
    case "en":
    default:
      return `Credits add to your balance. Valid for ${PAID_TERM_DAYS} days from this purchase.`;
  }
}

/** Replace `{key}` placeholders in long-form copy (FAQ, terms, i18n). */
export function interpolateSiteCopy(
  template: string,
  language: SupportedLanguage = "vi"
): string {
  const replacements: Record<string, string> = {
    paidTermDays: String(PAID_TERM_DAYS),
    giftDaily: String(GIFT_DAILY_GRANT),
    giftMonthlyCap: String(GIFT_MONTHLY_CAP),
    pillarCount: String(PILLAR_COUNT),
    languageCount: String(LANGUAGE_COUNT),
    packageCreditsList: formatPackageCreditsList(language),
    paidTermDaysLabel: paidTermDaysLabel(language),
  };

  let out = template;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}
