import type { SupportedLanguage } from "@/lib/types";

export const SUPPORTED_LANGUAGES_LIST: {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}[] = [
  { code: "vi", label: "Tiếng Việt", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { code: "zh", label: "Chinese (中文)", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "es", label: "Spanish (Español)", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "fr", label: "French (Français)", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "de", label: "German (Deutsch)", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "Japanese (日本語)", nativeLabel: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "Korean (한국어)", nativeLabel: "한국어", flag: "🇰🇷" },
  { code: "ru", label: "Russian (Русский)", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "pt", label: "Portuguese (Português)", nativeLabel: "Português", flag: "🇧🇷" },
  { code: "ar", label: "Arabic (العربية)", nativeLabel: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "Hindi (हिन्दी)", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "id", label: "Indonesian (Bahasa)", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "th", label: "Thai (ภาษาไทย)", nativeLabel: "ภาษาไทย", flag: "🇹🇭" },
];
