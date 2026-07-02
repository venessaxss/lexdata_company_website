"use client";

import { useEffect, useRef } from "react";
import { normalizeLanguage } from "@/lib/languages";
import type { AppLanguage } from "@/lib/languages";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
    tagName === "option" ||
    tagName === "code" ||
    tagName === "pre" ||
    tagName === "svg"
  ) {
    return true;
  }

  if (element.closest("[data-no-auto-translate]")) {
    return true;
  }

  return false;
}

function shouldTranslateText(value: string) {
  const text = normalizeText(value);

  if (!text) return false;
  if (text.length < 2) return false;
  if (text.length > 2000) return false;

  if (/^https?:\/\//i.test(text)) return false;
  if (/^[\d\s.,:/\-–—()%+]+$/.test(text)) return false;
  if (/^[^\p{L}\p{N}]+$/u.test(text)) return false;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(text)) return false;

  return true;
}

function collectTextNodes(root: ParentNode) {
  const nodes: Text[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (shouldSkipElement(parent)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!shouldTranslateText(node.textContent || "")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  return nodes;
}

function applyTranslation(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";

  return `${leading}${translated}${trailing}`;
}

async function requestTranslations(language: AppLanguage, texts: string[]) {
  const uniqueTexts = Array.from(new Set(texts.map(normalizeText))).filter(
    Boolean
  );

  if (uniqueTexts.length === 0) {
    return {};
  }

  const response = await fetch("/api/auto-translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language,
      texts: uniqueTexts,
    }),
  });

  if (!response.ok) {
    return {};
  }

  const data = await response.json();

  return (data?.translations ?? {}) as Record<string, string>;
}

export default function AutoTranslator({
  language,
}: {
  language?: string | null;
}) {
  const translatedNodesRef = useRef<WeakSet<Node>>(new WeakSet());

  useEffect(() => {
    const normalizedLanguage = normalizeLanguage(language);

    if (normalizedLanguage === "en") {
      return;
    }

    let cancelled = false;

    async function translateRoot(root: ParentNode) {
      const allNodes = collectTextNodes(root).filter(
        (node) => !translatedNodesRef.current.has(node)
      );

      if (allNodes.length === 0) {
        return;
      }

      const texts = allNodes.map((node) => normalizeText(node.textContent || ""));

      const translations = await requestTranslations(normalizedLanguage, texts);

      if (cancelled) {
        return;
      }

      for (const node of allNodes) {
        const original = node.textContent || "";
        const normalized = normalizeText(original);
        const translated = translations[normalized];

        if (translated && translated !== normalized) {
          node.textContent = applyTranslation(original, translated);
        }

        translatedNodesRef.current.add(node);
      }
    }

    translateRoot(document.body);

    const observer = new MutationObserver((mutations) => {
      const roots: ParentNode[] = [];

      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            roots.push(node as ParentNode);
          }

          if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            roots.push(node.parentElement);
          }
        }
      }

      for (const root of roots) {
        translateRoot(root);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [language]);

  return null;
}