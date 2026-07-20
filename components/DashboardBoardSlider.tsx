"use client";

import React, { Children, ReactNode, useMemo, useRef, useState } from "react";

type DashboardBoardSliderProps = {
  children: ReactNode;
  labels?: string[];
};

export default function DashboardBoardSlider({
  children,
  labels = ["Workspace", "Notifications", "Video"],
}: DashboardBoardSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const slides = useMemo(() => Children.toArray(children), [children]);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (nextIndex: number) => {
    if (!viewportRef.current || slides.length === 0) return;

    const index = (nextIndex + slides.length) % slides.length;
    const items = viewportRef.current.querySelectorAll<HTMLElement>("[data-board-slide]");
    const target = items[index];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setActiveIndex(index);
    }
  };

  const syncActiveSlide = () => {
    if (!viewportRef.current) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const items = Array.from(viewport.querySelectorAll<HTMLElement>("[data-board-slide]"));

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    });
  };

  return (
    <div className="lx-board-slider-shell">
      <button
        type="button"
        className="lx-board-arrow lx-board-arrow-left"
        aria-label="Previous board"
        onClick={() => scrollToIndex(activeIndex - 1)}
      >
        <span aria-hidden="true">&larr;</span>
      </button>

      <div
        ref={viewportRef}
        className="lx-board-slider-viewport"
        onScroll={syncActiveSlide}
      >
        <div className="lx-board-slider-track">
          {slides.map((slide, index) => (
            <article
              key={index}
              className={`lx-board-slide ${index === activeIndex ? "is-active" : ""}`}
              data-board-slide
              aria-label={labels[index] || `Board ${index + 1}`}
            >
              <div className="lx-board-slide-inner">{slide}</div>
              <div className="lx-board-slide-label">{labels[index] || `Board ${index + 1}`}</div>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="lx-board-arrow lx-board-arrow-right"
        aria-label="Next board"
        onClick={() => scrollToIndex(activeIndex + 1)}
      >
        <span aria-hidden="true">&rarr;</span>
      </button>

      <div className="lx-board-dots" aria-label="Board navigation">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`Open ${labels[index] || `board ${index + 1}`}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}