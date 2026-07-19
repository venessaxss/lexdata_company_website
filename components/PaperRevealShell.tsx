"use client";

import { useEffect, type ReactNode } from "react";

export default function PaperRevealShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("header");

    function handleScroll() {
      if (nav) {
        nav.classList.toggle("paper-scrolled", window.scrollY > 10);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");

            entry.target
              .querySelectorAll(".paper-draw")
              .forEach((item) => item.classList.add("in"));

            if (entry.target.classList.contains("paper-draw")) {
              entry.target.classList.add("in");
            }

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    document
      .querySelectorAll(".paper-rev, .paper-draw, .paper-page, .paper-turn")
      .forEach((element) => observer.observe(element));

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

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}