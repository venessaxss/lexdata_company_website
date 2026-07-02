import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  AppLanguage,
  getLanguageDirection,
  normalizeLanguage,
  t,
} from "@/lib/languages";

export async function getCurrentLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();

  const cookieLanguage = normalizeLanguage(
    cookieStore.get("lexdata_language")?.value
  );

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return cookieLanguage;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle();

    return normalizeLanguage(profile?.preferred_language || cookieLanguage);
  } catch {
    return cookieLanguage;
  }
}

export async function getServerI18n() {
  const language = await getCurrentLanguage();

  return {
    language,
    direction: getLanguageDirection(language),
    t: (key: Parameters<typeof t>[1]) => t(language, key),
  };
}