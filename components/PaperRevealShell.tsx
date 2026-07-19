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
      { threshold: 0.18 }
    );

    document
      .querySelectorAll(".paper-rev, .paper-draw")
      .forEach((element) => observer.observe(element));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}