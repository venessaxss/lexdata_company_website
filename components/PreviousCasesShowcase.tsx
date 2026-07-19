"use client";

import { useRef } from "react";
import Link from "next/link";

const cases = [
  {
    tag: "Case 01",
    title: "AI-assisted literature review workshop",
    body: "A practical workflow for finding, organizing, and synthesizing research with responsible GenAI support.",
    meta: "Academic training",
  },
  {
    tag: "Case 02",
    title: "Corpus annotation for discourse analysis",
    body: "From raw multilingual text to structured annotation layers for linguistic and social research.",
    meta: "Corpus linguistics",
  },
  {
    tag: "Case 03",
    title: "Machine translation evaluation pipeline",
    body: "A human-in-the-loop evaluation process for comparing MT output, error patterns, and revision quality.",
    meta: "Translation technology",
  },
  {
    tag: "Case 04",
    title: "NLP dashboard for language education",
    body: "Text cleaning, segmentation, keywords, topic models, and learning analytics in one research dashboard.",
    meta: "NLP + education",
  },
  {
    tag: "Case 05",
    title: "Legal and institutional language data",
    body: "Structured workflows for legal translation, terminology control, and document-based linguistic analysis.",
    meta: "Legal language",
  },
];

export default function PreviousCasesShowcase() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function move(direction: "left" | "right") {
    const element = trackRef.current;

    if (!element) return;

    element.scrollBy({
      left: direction === "right" ? 560 : -560,
      behavior: "smooth",
    });
  }

  return (
    <section className="lex-cases-stage paper-page" id="cases">
      <div className="lex-cases-head paper-rev">
        <p>Previous cases</p>
        <h2>Real projects, shown like living research drafts.</h2>
        <Link href="/cases">View all cases -&gt;</Link>
      </div>

      <div className="lex-cases-doodle-left" aria-hidden="true">
        <svg viewBox="0 0 220 170">
          <path d="M34 126h118M47 102h88M61 78h62M51 48h84l24 58-24 38H51L29 103Z" />
          <path d="M142 102h48M165 82l28 20-28 20" />
        </svg>
      </div>

      <div className="lex-cases-carousel">
        <button type="button" className="lex-case-arrow lex-case-arrow-left" onClick={() => move("left")}>
          ←
        </button>

        <div className="lex-cases-track" ref={trackRef}>
          {cases.map((item, index) => (
            <article key={item.title} className="lex-case-card">
              <div className="lex-case-paper">
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <b>{item.meta}</b>
              </div>

              <div className="lex-case-notes">
                <span>Draft {index + 1}</span>
                <span>annotation</span>
                <span>review</span>
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="lex-case-arrow lex-case-arrow-right" onClick={() => move("right")}>
          →
        </button>
      </div>

      <p className="lex-cases-caption paper-rev">
        Stay in control with connected cases, courses, and research workflows.
      </p>
    </section>
  );
}