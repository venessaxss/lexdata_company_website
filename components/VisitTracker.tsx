"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getVisitorId() {
  const key = "lexdata_visitor_id";

  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, created);

  return created;
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const ignoredPrefixes = ["/api", "/_next"];

    if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      fetch("/api/visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          visitor_id: getVisitorId(),
          path: pathname,
          title: document.title,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        }),
      }).catch(() => {});
    }, 800);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pathname]);

  return null;
}