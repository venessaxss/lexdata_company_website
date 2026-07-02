export const SUPPORTED_LANGUAGES = [
  "en",
  "zh",
  "mn",
  "ar",
  "ur",
  "az",
  "tr",
  "ja",
  "ko",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  zh: "中文",
  mn: "Монгол",
  ar: "العربية",
  ur: "اردو",
  az: "Azərbaycanca",
  tr: "Türkçe",
  ja: "日本語",
  ko: "한국어",
};

export const LANGUAGE_SHORT_LABELS: Record<AppLanguage, string> = {
  en: "EN",
  zh: "中文",
  mn: "MN",
  ar: "AR",
  ur: "UR",
  az: "AZ",
  tr: "TR",
  ja: "日本",
  ko: "한국",
};

export const LANGUAGE_DIRECTIONS: Record<AppLanguage, "ltr" | "rtl"> = {
  en: "ltr",
  zh: "ltr",
  mn: "ltr",
  ar: "rtl",
  ur: "rtl",
  az: "ltr",
  tr: "ltr",
  ja: "ltr",
  ko: "ltr",
};

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (
    value === "en" ||
    value === "zh" ||
    value === "mn" ||
    value === "ar" ||
    value === "ur" ||
    value === "az" ||
    value === "tr" ||
    value === "ja" ||
    value === "ko"
  ) {
    return value;
  }

  return "en";
}

export function getLanguageDirection(value?: string | null): "ltr" | "rtl" {
  return LANGUAGE_DIRECTIONS[normalizeLanguage(value)];
}