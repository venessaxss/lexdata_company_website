"use client";

/** Gentle scroll reveals for the About page (paper & ink style). */
import { useEffect } from "react";

export default function AboutReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("ab-in");
          entry.target
            .querySelectorAll(".ab-draw")
            .forEach((d) => d.classList.add("ab-in"));
          io.unobserve(entry.target);
        }),
      { threshold: 0.18 }
    );
    document.querySelectorAll(".ab-rev").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
