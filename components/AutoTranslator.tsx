"use client";

import { useEffect } from "react";
import type { AppLanguage } from "@/lib/languages";
import { normalizeLanguage } from "@/lib/languages";
import { AUTO_TRANSLATIONS } from "@/lib/auto-translations";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translateText(value: string, language: AppLanguage) {
  if (language === "en") {
    return value;
  }

  const normalized = normalizeText(value);

  if (!normalized) {
    return value;
  }

  const direct = AUTO_TRANSLATIONS[normalized]?.[language];

  if (direct) {
    return value.replace(normalized, direct);
  }

  return value;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;

  const tagName = element.tagName.toLowerCase();

  if (
    tagName === "script" ||
    tagName === "style" ||
    tagName === "textarea" ||
    tagName === "input" ||
    tagName === "select" ||
    tagName === "option"
  ) {
    return true;
  }

  if (element.closest("[data-no-auto-translate]")) {
    return true;
  }

  return false;
}

function translateNode(node: Node, language: AppLanguage) {
  if (language === "en") return;

  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;

    if (shouldSkipElement(parent)) {
      return;
    }

    const original = node.textContent || "";
    const translated = translateText(original, language);

    if (translated !== original) {
      node.textContent = translated;
    }

    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;

    if (shouldSkipElement(element)) {
      return;
    }

    for (const child of Array.from(element.childNodes)) {
      translateNode(child, language);
    }
  }
}

export default function AutoTranslator({
  language,
}: {
  language?: string | null;
}) {
  useEffect(() => {
    const normalizedLanguage = normalizeLanguage(language);

    if (normalizedLanguage === "en") {
      return;
    }

    translateNode(document.body, normalizedLanguage);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          translateNode(node, normalizedLanguage);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}