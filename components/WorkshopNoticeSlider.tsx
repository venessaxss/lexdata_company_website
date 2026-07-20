"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { WorkshopNotice } from "@/content/workshopNotices";

type WorkshopNoticeSliderProps = {
  notices: WorkshopNotice[];
};

export default function WorkshopNoticeSlider({
  notices,
}: WorkshopNoticeSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (nextIndex: number) => {
    const viewport = viewportRef.current;
    if (!viewport || notices.length === 0) return;

    const index = (nextIndex + notices.length) % notices.length;
    const slides = viewport.querySelectorAll<HTMLElement>("[data-workshop-slide]");
    const target = slides[index];

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveIndex(index);
  };

  const syncActiveIndex = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const slides = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-workshop-slide]")
    );

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragState.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
      moved: false,
    };

    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !dragState.current.active) return;

    const distance = event.clientX - dragState.current.startX;

    if (Math.abs(distance) > 5) {
      dragState.current.moved = true;
    }

    viewport.scrollLeft = dragState.current.scrollLeft - distance;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragState.current.active = false;

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    syncActiveIndex();
  };

  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="lx-workshop-notice-section" id="workshops">
      <div className="lx-workshop-notice-head">
        <div>
          <p>WORKSHOPS AND NOTICES</p>
          <h2>New sessions, new posters, new opportunities.</h2>
        </div>
        <p className="lx-workshop-notice-copy">
          Upload workshop posters and keep this section updated with your newest
          training sessions, seminars, and registration notices.
        </p>
      </div>

      <div className="lx-workshop-slider-shell">
        <button
          type="button"
          className="lx-workshop-arrow lx-workshop-arrow-left"
          aria-label="Previous workshop notice"
          onClick={() => scrollToIndex(activeIndex - 1)}
        >
          <span aria-hidden="true">&larr;</span>
        </button>

        <div
          ref={viewportRef}
          className="lx-workshop-slider-viewport"
          onScroll={syncActiveIndex}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="lx-workshop-slider-track">
            {notices.map((notice, index) => {
              const card = (
                <article
                  className={`lx-workshop-poster-card ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                >
                  <div className="lx-workshop-poster-frame">
                    {notice.poster ? (
                      <img
                        src={notice.poster}
                        alt={`${notice.title} poster`}
                        draggable={false}
                      />
                    ) : (
                      <div className="lx-workshop-poster-placeholder">
                        <span>POSTER</span>
                        <strong>Upload your workshop poster</strong>
                        <small>public/workshop-posters</small>
                      </div>
                    )}

                    <span className="lx-workshop-badge">
                      {notice.badge || "WORKSHOP"}
                    </span>
                  </div>

                  <div className="lx-workshop-card-copy">
                    <div className="lx-workshop-card-meta">
                      <span>{notice.date}</span>
                      <span>{notice.venue}</span>
                    </div>

                    <h3>{notice.title}</h3>
                    <p>{notice.summary}</p>

                    <span className="lx-workshop-card-action">
                      {notice.href ? "View details" : "Poster notice"}
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </article>
              );

              return (
                <div
                  key={notice.id}
                  className="lx-workshop-slide"
                  data-workshop-slide
                >
                  {notice.href ? (
                    <a
                      href={notice.href}
                      className="lx-workshop-card-link"
                      onClick={(event) => {
                        if (dragState.current.moved) {
                          event.preventDefault();
                        }
                      }}
                    >
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="lx-workshop-arrow lx-workshop-arrow-right"
          aria-label="Next workshop notice"
          onClick={() => scrollToIndex(activeIndex + 1)}
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <div className="lx-workshop-slider-footer">
        <div className="lx-workshop-dots" aria-label="Workshop notice navigation">
          {notices.map((notice, index) => (
            <button
              key={notice.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Open workshop notice ${index + 1}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>

        <span>
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(notices.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}