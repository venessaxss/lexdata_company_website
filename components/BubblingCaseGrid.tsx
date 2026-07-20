"use client";

import { useEffect, useRef } from "react";

const caseCards = [
  { label: "Case 01", title: "Corpus-based research training", body: "From raw text collection to cleaning, annotation, and analysis-ready datasets." },
  { label: "Case 02", title: "Multilingual translation workflow", body: "Human-in-the-loop terminology, translation review, and bilingual quality control." },
  { label: "Case 03", title: "AI research classroom", body: "Generative AI, Python, and NLP turned into practical workshops for humanities researchers." },
];

export default function BubblingCaseGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-bubble-card]"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) (entry.target as HTMLElement).classList.add("is-visible");
      }),
      { threshold: 0.18 }
    );

    cards.forEach((card) => observer.observe(card));

    const cleanup: Array<() => void> = [];
    cards.forEach((card) => {
      const move = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--card-x", String(x));
        card.style.setProperty("--card-y", String(y));
      };
      const leave = () => {
        card.style.setProperty("--card-x", "0");
        card.style.setProperty("--card-y", "0");
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      cleanup.push(() => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      });
    });

    return () => {
      observer.disconnect();
      cleanup.forEach((dispose) => dispose());
    };
  }, []);

  return (
    <div ref={gridRef} className="lx-case-bubble-stage">
      <div className="lx-case-bubbles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ "--bubble-i": index } as React.CSSProperties} />
        ))}
      </div>

      <div className="lx-case-grid lx-case-grid-bubbling">
        {caseCards.map((card, index) => (
          <article
            key={card.title}
            className="lx-case-card lx-case-bubble-card"
            data-bubble-card
            style={{ "--case-i": index } as React.CSSProperties}
          >
            <span>{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <i className="lx-case-orbit lx-case-orbit-a" aria-hidden="true" />
            <i className="lx-case-orbit lx-case-orbit-b" aria-hidden="true" />
          </article>
        ))}
      </div>
    </div>
  );
}