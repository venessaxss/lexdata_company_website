import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { Credentials, Translator } from "@translated/lara";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TranslateRequest = {
  language?: string;
  texts?: string[];
};

type CacheRow = {
  source_hash: string;
  source_text: string;
  target_language: string;
  translated_text: string;
};

const LARA_TARGET_LANGUAGE_MAP: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  mn: "mn-MN",
  ar: "ar-SA",
  ur: "ur-PK",
  az: "az-AZ",
  tr: "tr-TR",
  ja: "ja-JP",
  ko: "ko-KR",
};

const LIBRE_TARGET_LANGUAGE_MAP: Record<string, string | null> = {
  en: "en",
  zh: "zh",
  mn: null,
  ar: "ar",
  ur: "ur",
  az: "az",
  tr: "tr",
  ja: "ja",
  ko: "ko",
};

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shouldTranslate(value: string) {
  const text = cleanText(value);

  if (!text) return false;
  if (text.length < 2) return false;
  if (text.length > 2000) return false;

  if (/^https?:\/\//i.test(text)) return false;
  if (/^[\d\s.,:/\-–—()%+]+$/.test(text)) return false;
  if (/^[^\p{L}\p{N}]+$/u.test(text)) return false;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(text)) return false;

  return true;
}

function uniqueTexts(texts: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of texts) {
    const cleaned = cleanText(item);

    if (!shouldTranslate(cleaned)) continue;
    if (seen.has(cleaned)) continue;

    seen.add(cleaned);
    result.push(cleaned);
  }

  return result.slice(0, 60);
}

async function translateWithLibreTranslate(text: string, language: string) {
  const baseUrl = process.env.TRANSLATE_API_URL;
  const apiKey = process.env.TRANSLATE_API_KEY;
  const target = LIBRE_TARGET_LANGUAGE_MAP[language];

  if (!baseUrl) {
    return {
      translatedText: text,
      usedProvider: false,
      provider: "libretranslate",
      error: "Missing TRANSLATE_API_URL",
    };
  }

  if (!target) {
    return {
      translatedText: text,
      usedProvider: false,
      provider: "libretranslate",
      error: `LibreTranslate does not support target language: ${language}`,
    };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target,
        format: "text",
        api_key: apiKey || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return {
        translatedText: text,
        usedProvider: true,
        provider: "libretranslate",
        error: errorText || `LibreTranslate HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (typeof data?.translatedText === "string" && data.translatedText.trim()) {
      return {
        translatedText: data.translatedText.trim(),
        usedProvider: true,
        provider: "libretranslate",
        error: null,
      };
    }

    return {
      translatedText: text,
      usedProvider: true,
      provider: "libretranslate",
      error: "LibreTranslate returned empty translation",
    };
  } catch (error) {
    return {
      translatedText: text,
      usedProvider: true,
      provider: "libretranslate",
      error:
        error instanceof Error
          ? error.message
          : "Unknown LibreTranslate error",
    };
  }
}

function getLaraTranslator() {
  const accessKeyId = process.env.LARA_ACCESS_KEY_ID;
  const accessKeySecret = process.env.LARA_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    return null;
  }

  const credentials = new Credentials(accessKeyId, accessKeySecret);
  return new Translator(credentials);
}

async function translateWithLara(text: string, language: string) {
  const lara = getLaraTranslator();

  if (!lara) {
    return {
      translatedText: text,
      usedProvider: false,
      provider: "lara",
      error: "Missing LARA_ACCESS_KEY_ID or LARA_ACCESS_KEY_SECRET",
    };
  }

  const target = LARA_TARGET_LANGUAGE_MAP[language] || language;

  try {
    const result = await lara.translate(text, "en-US", target);

    const translated = result?.translation;

    if (typeof translated === "string" && translated.trim()) {
      return {
        translatedText: translated.trim(),
        usedProvider: true,
        provider: "lara",
        error: null,
      };
    }

    return {
      translatedText: text,
      usedProvider: true,
      provider: "lara",
      error: "Lara returned empty translation",
    };
  } catch (error) {
    return {
      translatedText: text,
      usedProvider: true,
      provider: "lara",
      error:
        error instanceof Error
          ? error.message
          : "Unknown Lara translation error",
    };
  }
}

async function translateText(text: string, language: string) {
  const provider = process.env.TRANSLATE_PROVIDER || "libretranslate";

  if (provider === "lara") {
    return translateWithLara(text, language);
  }

  const libreResult = await translateWithLibreTranslate(text, language);

  if (
    libreResult.translatedText &&
    libreResult.translatedText !== text &&
    !libreResult.error
  ) {
    return libreResult;
  }

  const laraResult = await translateWithLara(text, language);

  if (
    laraResult.translatedText &&
    laraResult.translatedText !== text &&
    !laraResult.error
  ) {
    return laraResult;
  }

  return libreResult;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TranslateRequest;

    const language = normalizeLanguage(payload.language);
    const texts = uniqueTexts(payload.texts ?? []);

    const debug = {
      language,
      provider: process.env.TRANSLATE_PROVIDER || "libretranslate",
      textCount: texts.length,
      hasTranslateApiUrl: Boolean(process.env.TRANSLATE_API_URL),
      hasLaraAccessKeyId: Boolean(process.env.LARA_ACCESS_KEY_ID),
      hasLaraAccessKeySecret: Boolean(process.env.LARA_ACCESS_KEY_SECRET),
      providerCalls: 0,
      cacheHits: 0,
      errors: [] as string[],
    };

    if (language === "en") {
      return NextResponse.json({
        ok: true,
        language,
        debug,
        translations: {},
      });
    }

    if (texts.length === 0) {
      return NextResponse.json({
        ok: true,
        language,
        debug,
        translations: {},
      });
    }

    const supabase = createAdminClient();

    const hashes = texts.map((text) => hashText(text));

    const { data: cachedData } = await supabase
      .from("auto_translation_cache")
      .select("source_hash, source_text, target_language, translated_text")
      .eq("target_language", language)
      .in("source_hash", hashes);

    const cachedRows = (cachedData ?? []) as CacheRow[];

    const cachedMap = new Map<string, string>();

    for (const row of cachedRows) {
      if (row.translated_text && row.translated_text !== row.source_text) {
        cachedMap.set(row.source_hash, row.translated_text);
      }
    }

    const translations: Record<string, string> = {};

    for (const text of texts) {
      const hash = hashText(text);
      const cached = cachedMap.get(hash);

      if (cached) {
        debug.cacheHits += 1;
        translations[text] = cached;
        continue;
      }

      const result = await translateText(text, language);

      debug.providerCalls += result.usedProvider ? 1 : 0;

      if (result.error) {
        debug.errors.push(`${text}: ${result.provider}: ${result.error}`);
      }

      translations[text] = result.translatedText;

      if (result.translatedText && result.translatedText !== text) {
        await supabase.from("auto_translation_cache").upsert(
          {
            source_hash: hash,
            source_text: text,
            target_language: language,
            translated_text: result.translatedText,
            provider: result.provider,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "source_hash,target_language",
          }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      language,
      debug,
      translations,
    });
  } catch (error) {
    console.error("Auto translation route failed:", error);

    return NextResponse.json({
      ok: false,
      language: null,
      debug: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown auto translation error",
      },
      translations: {},
    });
  }
}