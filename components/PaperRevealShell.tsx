"use client";

import { useEffect, type ReactNode } from "react";

export default function PaperRevealShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>("header");

    root.classList.add("paper-motion-ready");

    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), max);
    }

    function revealElement(element: Element) {
      element.classList.add("in");

      element
        .querySelectorAll(".paper-draw, .paper-rev, .paper-page, .paper-turn")
        .forEach((item) => item.classList.add("in"));
    }

    function revealVisibleElements() {
      const elements = document.querySelectorAll(
        ".paper-rev, .paper-draw, .paper-page, .paper-turn"
      );

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isNearViewport =
          rect.top < window.innerHeight * 1.15 && rect.bottom > -window.innerHeight * 0.25;

        if (isNearViewport) {
          revealElement(element);
        }
      });
    }

    function handleScroll() {
      const scrollY = window.scrollY;

      if (nav) {
        nav.classList.toggle("paper-scrolled", scrollY > 12);
        nav.classList.toggle("paper-nav-hero", scrollY < window.innerHeight * 0.72);
      }

      document.querySelectorAll<HTMLElement>("[data-paper-cover]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const start = window.innerHeight * 0.88;
        const end = window.innerHeight * 0.18;
        const progress = clamp((start - rect.top) / (start - end), 0, 1);
        section.style.setProperty("--paper-cover", progress.toFixed(3));
      });

      revealVisibleElements();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 18% 0px",
      }
    );

    function observeAll() {
      document
        .querySelectorAll(".paper-rev, .paper-draw, .paper-page, .paper-turn")
        .forEach((element) => {
          observer.observe(element);
        });

      revealVisibleElements();
    }

    observeAll();
    handleScroll();

    const mutationObserver = new MutationObserver(() => {
      observeAll();
      window.requestAnimationFrame(revealVisibleElements);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    function handlePointerMove(event: PointerEvent) {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;

      document.querySelectorAll<HTMLElement>("[data-paper-float]").forEach((el) => {
        const strength = Number(el.dataset.paperFloat || "12");
        el.style.transform = `translate3d(${x * strength}px, ${
          y * strength
        }px, 0) rotate(var(--r, 0deg))`;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.addEventListener("pageshow", handleScroll);
    window.addEventListener("pointermove", handlePointerMove);

    const failSafeTimer = window.setTimeout(() => {
      root.classList.add("paper-effects-failsafe");
      revealVisibleElements();
    }, 2200);

    return () => {
      window.clearTimeout(failSafeTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("pageshow", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}