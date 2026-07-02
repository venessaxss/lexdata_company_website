"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AppLanguage } from "@/lib/languages";
import {
  LANGUAGE_LABELS,
  LANGUAGE_SHORT_LABELS,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
} from "@/lib/languages";

export default function LanguageSwitcher({
  currentLanguage = "en",
  compact = false,
}: {
  currentLanguage?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguage(currentLanguage)
  );

  function updateLanguage(nextLanguage: string) {
    const normalizedLanguage = normalizeLanguage(nextLanguage);

    setLanguage(normalizedLanguage);

    startTransition(async () => {
      await fetch("/api/language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: normalizedLanguage,
        }),
      });

      router.refresh();
    });
  }

  return (
    <select
      value={language}
      disabled={isPending}
      onChange={(event) => updateLanguage(event.target.value)}
      className={
        compact
          ? "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      }
    >
      {SUPPORTED_LANGUAGES.map((item) => (
        <option key={item} value={item}>
          {compact ? LANGUAGE_SHORT_LABELS[item] : LANGUAGE_LABELS[item]}
        </option>
      ))}
    </select>
  );
}