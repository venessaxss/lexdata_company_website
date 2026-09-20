"use client";

// components/WorkshopHighlightsYears.tsx
// Years first. Hover a year (desktop) or tap it (touch) to open that year's
// workshops; click a workshop to open its detail page.
// Each year tile shows the most common topic tags from that year's workshops.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { YearGroup } from "@/lib/workshop-highlights";
import "./WorkshopHighlightsYears.css";

// Most frequent tags across a year's workshops (ties keep first-seen order)
function topTags(workshops: YearGroup["workshops"], limit = 3): string[] {
  const seen = new Map<string, { label: string; count: number; order: number }>();

  workshops.forEach((workshop) => {
    (workshop.tags ?? []).forEach((raw) => {
      const label = raw.trim();
      if (!label) return;
      const key = label.toLowerCase();
      const entry = seen.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        seen.set(key, { label, count: 1, order: seen.size });
      }
    });
  });

  return Array.from(seen.values())
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map((tag) => tag.label);
}

export default function WorkshopHighlightsYears({ groups }: { groups: YearGroup[] }) {
  const [openYear, setOpenYear] = useState<string | null>(null);
  const isMouse = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Tap outside the years row closes the open dropdown (mainly for touch)
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setOpenYear(null);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (groups.length === 0) {
    return (
      <section className="wh-years" id="browse-by-year">
        <div className="wh-years-inner">
          <p className="wh-years-hint">
            Workshop highlights will appear here as soon as the first one is published.
          </p>
        </div>
      </section>
    );
  }

  // Reserve just enough room under the tiles for the tallest dropdown
  const tallest = Math.max(...groups.map((g) => g.workshops.length));

  return (
    <section
      className="wh-years"
      id="browse-by-year"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenYear(null);
      }}
    >
      <div className="wh-years-inner">
        <h2 className="wh-years-heading">Browse by year</h2>
        <p className="wh-years-hint">
          Every workshop we have run, grouped by the year it took place. Pick a year to see its
          workshops.
        </p>

        <div
          className="wh-years-row"
          ref={rowRef}
          style={{ "--wh-max": tallest } as CSSProperties}
        >
          {groups.map((group) => {
            const isOpen = openYear === group.year;
            const tags = topTags(group.workshops);
            const covers = group.workshops.slice(0, 3);
            const panelId = `wh-year-panel-${group.year}`;

            return (
              <div
                key={group.year}
                className={`wh-year${isOpen ? " is-open" : ""}`}
                onPointerEnter={(event) => {
                  isMouse.current = event.pointerType === "mouse";
                  if (isMouse.current) setOpenYear(group.year);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") setOpenYear(null);
                }}
                onBlur={(event) => {
                  // Keyboard: close when focus moves to something outside this year
                  const next = event.relatedTarget as Node | null;
                  if (next && !event.currentTarget.contains(next)) setOpenYear(null);
                }}
              >
                <button
                  type="button"
                  className="wh-year-btn"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={(event) => {
                    // Mouse users already opened it by hovering; touch and keyboard toggle
                    if (event.detail === 0 || !isMouse.current) {
                      setOpenYear(isOpen ? null : group.year);
                    }
                  }}
                >
                  <span className="wh-year-head">
                    <span className="wh-year-num">{group.year}</span>
                    {tags.length > 0 ? (
                      <span className="wh-year-tags">
                        {tags.map((tag) => (
                          <span key={tag} className="wh-year-tag">
                            {tag}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>

                  <span className="wh-year-foot">
                    <span className="wh-year-covers" aria-hidden="true">
                      {covers.map((workshop) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={workshop.slug} src={workshop.cover} alt="" loading="lazy" />
                      ))}
                    </span>

                    <span className="wh-year-toggle" aria-hidden="true">
                      <span className="wh-year-chevron" />
                    </span>
                  </span>
                </button>

                <div className="wh-year-panel" id={panelId}>
                  <div className="wh-year-panel-box">
                    <ul className="wh-year-list">
                      {group.workshops.map((workshop, index) => (
                        <li key={workshop.slug}>
                          <Link
                            href={`/workshop-highlights/${workshop.slug}`}
                            className="wh-year-link"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="wh-year-thumb"
                              src={workshop.cover}
                              alt=""
                              loading="lazy"
                            />
                            <span className="wh-year-link-text">
                              <span className="wh-year-link-meta">
                                <span>Workshop {index + 1}</span>
                                {workshop.dateLabel ? <span>{workshop.dateLabel}</span> : null}
                              </span>
                              <span className="wh-year-link-title">{workshop.title}</span>
                            </span>
                            <span className="wh-year-link-go" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}