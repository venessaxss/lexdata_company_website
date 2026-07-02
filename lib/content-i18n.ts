import type { AppLanguage } from "@/lib/languages";

type TranslationMap = Record<string, Record<string, string | null | undefined>>;

export type TranslatableRecord = {
  translations?: TranslationMap | null;
  [key: string]: unknown;
};

export function getTranslatedField<T extends TranslatableRecord>(
  record: T,
  language: AppLanguage,
  field: string
) {
  const translatedValue = record.translations?.[language]?.[field];

  if (typeof translatedValue === "string" && translatedValue.trim()) {
    return translatedValue;
  }

  const fallbackValue = record[field];

  if (typeof fallbackValue === "string") {
    return fallbackValue;
  }

  if (fallbackValue === null || fallbackValue === undefined) {
    return "";
  }

  return String(fallbackValue);
}

export function localizeRecord<T extends TranslatableRecord>(
  record: T,
  language: AppLanguage,
  fields: string[]
): T {
  const localized: Record<string, unknown> = {
    ...record,
  };

  for (const field of fields) {
    localized[field] = getTranslatedField(record, language, field);
  }

  return localized as T;
}

export function localizeRecords<T extends TranslatableRecord>(
  records: T[],
  language: AppLanguage,
  fields: string[]
): T[] {
  return records.map((record) => localizeRecord(record, language, fields));
}

export function parseTranslationsFromForm(formData: FormData) {
  const raw = String(formData.get("translations") ?? "").trim();

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}