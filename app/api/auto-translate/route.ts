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

function getLaraTranslator() {
  const accessKeyId = process.env.LARA_ACCESS_KEY_ID;
  const accessKeySecret = process.env.LARA_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    return null;
  }

  const credentials = new Credentials(accessKeyId, accessKeySecret);
  return new Translator(credentials);
}

async function translateWithLara(text: string, targetLanguage: string) {
  const lara = getLaraTranslator();

  if (!lara) {
    return text;
  }

  const target = LARA_TARGET_LANGUAGE_MAP[targetLanguage] || targetLanguage;

  try {
    const result = await lara.translate(text, "en-US", target, {
      style: "fluid",
      contentType: "text/plain",
      noTrace: true,
    });

    const translated = result?.translation;

    if (typeof translated === "string" && translated.trim()) {
      return translated.trim();
    }

    return text;
  } catch (error) {
    console.error("Lara translation failed:", error);
    return text;
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TranslateRequest;

    const language = normalizeLanguage(payload.language);

    if (language === "en") {
      return NextResponse.json({
        ok: true,
        translations: {},
      });
    }

    const texts = uniqueTexts(payload.texts ?? []);

    if (texts.length === 0) {
      return NextResponse.json({
        ok: true,
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
      cachedMap.set(row.source_hash, row.translated_text);
    }

    const translations: Record<string, string> = {};

    for (const text of texts) {
      const hash = hashText(text);
      const cached = cachedMap.get(hash);

      if (cached) {
        translations[text] = cached;
        continue;
      }

      const translatedText = await translateWithLara(text, language);

      translations[text] = translatedText;

      await supabase.from("auto_translation_cache").upsert(
        {
          source_hash: hash,
          source_text: text,
          target_language: language,
          translated_text: translatedText,
          provider: "lara",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "source_hash,target_language",
        }
      );
    }

    return NextResponse.json({
      ok: true,
      translations,
    });
  } catch (error) {
    console.error("Auto translation route failed:", error);

    return NextResponse.json({
      ok: true,
      translations: {},
    });
  }
}