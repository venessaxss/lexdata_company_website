"use client";

import { useEffect, useRef, useState } from "react";
import { artisticTemplates } from "@/content/artisticTemplates";

function ArtisticVisual({ id }: { id: string }) {
  if (id === "desk") {
    return (
      <div className="lx-art-scene lx-art-scene-desk" aria-hidden="true">
        <div className="lx-art-paper lx-art-paper-a">
          <span>FIELD NOTES</span><i /><i /><i />
        </div>
        <div className="lx-art-paper lx-art-paper-b">
          <span>CORPUS</span><strong>01</strong>
        </div>
        <div className="lx-art-laptop">
          <small>HUMAN</small><strong>IN THE LOOP</strong>
        </div>
        <div className="lx-art-sticky">ask<br /><b>better questions</b></div>
      </div>
    );
  }

  if (id === "orbit") {
    return (
      <div className="lx-art-scene lx-art-scene-orbit" aria-hidden="true">
        <div className="lx-art-core"><span>HUMAN</span><strong>JUDGMENT</strong></div>
        <div className="lx-art-ring lx-art-ring-a"><span>CONTEXT</span></div>
        <div className="lx-art-ring lx-art-ring-b"><span>LANGUAGE</span></div>
        <div className="lx-art-ring lx-art-ring-c"><span>EVIDENCE</span></div>
        <i className="lx-art-dot lx-art-dot-a" />
        <i className="lx-art-dot lx-art-dot-b" />
        <i className="lx-art-dot lx-art-dot-c" />
      </div>
    );
  }

  if (id === "archive") {
    return (
      <div className="lx-art-scene lx-art-scene-archive" aria-hidden="true">
        <div className="lx-art-card lx-art-card-a"><span>ARCHIVE 04</span><strong>YOUR DATA</strong></div>
        <div className="lx-art-card lx-art-card-b"><span>ANNOTATION</span><strong>CONTEXT</strong></div>
        <div className="lx-art-card lx-art-card-c"><span>RESEARCH</span><strong>MEMORY</strong></div>
        <div className="lx-art-folder"><span>PRIVATE</span><strong>WORKING FILES</strong></div>
      </div>
    );
  }

  return (
    <div className="lx-art-scene lx-art-scene-notes" aria-hidden="true">
      <div className="lx-art-sheet">
        <span>RESEARCH DRAFT</span>
        <p>language is not a checkbox.<br />context is not optional.</p>
        <strong>keep the researcher in control</strong>
      </div>
      <i className="lx-art-note lx-art-note-a">why?</i>
      <i className="lx-art-note lx-art-note-b">verify this</i>
      <i className="lx-art-note lx-art-note-c">human first</i>
    </div>
  );
}

export default function DynamicArtisticStatement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.2),
      { threshold: [0, 0.2, 0.5] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % artisticTemplates.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [visible, paused]);

  const active = artisticTemplates[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex((index + artisticTemplates.length) % artisticTemplates.length);
  };

  return (
    <div
      ref={sectionRef}
      className="lx-art-dynamic"
      data-template={active.id}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lx-art-visual">
        <div key={active.id} className="lx-art-template-frame">
          <ArtisticVisual id={active.id} />
        </div>
        <div className="lx-art-template-label">
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <strong>{active.label}</strong>
        </div>
      </div>

      <div className="lx-art-copy-panel">
        <p className="lx-art-eyebrow">RESEARCH, NOT OPAQUE AUTOMATION</p>

        <h3>
          We think researchers should be free to{" "}
          <span className="lx-art-underline">express their creative vision</span>{" "}
          鈥?away from opaque automation and the{" "}
          <span className="lx-art-circle">prying eyes of AI.</span>
        </h3>

        <div className="lx-art-principle">
          <span>Your content is</span>
          <strong>YOURS.</strong>
          <span>Human judgment stays in control.</span>
        </div>

        <div className="lx-art-controls">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous template"><span aria-hidden="true">&#8592;</span></button>

          <div className="lx-art-dots">
            {artisticTemplates.map((template, index) => (
              <button
                key={template.id}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                aria-label={`Show ${template.label}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next template"><span aria-hidden="true">&#8594;</span></button>
        </div>

        <p className="lx-art-accent-note">{active.accent}</p>
      </div>
    </div>
  );
}
