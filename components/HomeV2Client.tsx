"use client";

/**
 * LexData — dynamic rendering V2 ("Night Archive")
 * Route: app/home-v2/page.tsx  →  https://yoursite.com/home-v2
 *
 * Content-only: renders NO navbar and NO footer, so it inherits whatever
 * chrome your app/layout.tsx already provides. Promote it to "/" later by
 * copying this file over app/page.tsx (see INTEGRATION-V2.md).
 */

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Reveal2,
  CharReveal,
  ScrollProgress,
  SpotlightSection,
  GlyphGrid,
  ScrollTicker,
  Pipeline,
  TiltCard,
  Magnetic,
} from "@/components/motion2";

const STAGES = [
  {
    step: "01",
    title: "Corpus",
    body: "We gather and structure the raw language — documents, transcripts, translations — into research-grade datasets.",
  },
  {
    step: "02",
    title: "Annotation",
    body: "Linguists and domain experts label what matters, with quality pipelines that keep every judgment traceable.",
  },
  {
    step: "03",
    title: "Model",
    body: "We train and evaluate models on your annotated data — honestly benchmarked, never oversold.",
  },
  {
    step: "04",
    title: "Insight",
    body: "Findings land as decisions: better translations, better teaching, better evidence for social questions.",
  },
];

const OFFERS = [
  {
    tag: "SERVICE",
    title: "Language data engineering",
    body: "Multilingual corpora, terminology systems, and annotation workflows built to academic standards.",
    href: "/services",
  },
  {
    tag: "COURSE",
    title: "Data science for the humanities",
    body: "From spreadsheets to working NLP pipelines — courses designed for humanists, not engineers.",
    href: "/courses",
  },
  {
    tag: "WORKSHOP",
    title: "Hands-on intensives",
    body: "Short, practical workshops for teams and classrooms: MT evaluation, text mining, corpus methods.",
    href: "/workshops",
  },
];

const TICKER = [
  "Corpus linguistics",
  "Machine translation",
  "NLP for the humanities",
  "Terminology",
  "Digital pedagogy",
  "Text mining",
  "Open social data",
];

export default function HomeV2() {
  return (
    <div className="lx2-root">
      <ScrollProgress />

      {/* ============ HERO: lamplight spotlight + char reveal ============ */}
      <SpotlightSection className="lx2-hero">
        <GlyphGrid />
        <div className="lx2-container">
          <Reveal2>
            <span className="lx2-label">LexData · The night archive is open</span>
          </Reveal2>
          <h1>
            <CharReveal text="Every language is" />{" "}
            <span className="lx2-serif-accent">data</span>{" "}
            <CharReveal text="waiting to speak." />
          </h1>
          <Reveal2 delay={0.5}>
            <p className="lx2-hero-sub">
              LexData bridges the humanities and data science for real-world
              impact — intelligent data solutions for language, translation,
              education &amp; society.
            </p>
          </Reveal2>
          <Reveal2 delay={0.65}>
            <div className="lx2-hero-ctas">
              <Magnetic>
                <Link href="/courses" className="lx2-btn lx2-btn-amber">
                  Explore courses →
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/services" className="lx2-btn lx2-btn-line">
                  Our services
                </Link>
              </Magnetic>
            </div>
          </Reveal2>
        </div>
      </SpotlightSection>

      {/* ============ TICKER: moves only when the user scrolls ============ */}
      <ScrollTicker items={TICKER} />

      {/* ============ SIGNATURE: sticky scroll-driven pipeline ============ */}
      <Pipeline heightVh={280}>
        {(progress, active) => (
          <div className="lx2-container">
            <div className="lx2-pipeline-head">
              <span className="lx2-label">Our method</span>
              <h2>
                One arc, every project:{" "}
                <span className="lx2-serif-accent">keep scrolling</span> to
                trace it.
              </h2>
            </div>
            <div className="lx2-stages">
              <div
                className="lx2-track-fill"
                style={{ "--lx2-p": progress } as CSSProperties}
              />
              {STAGES.map((s, i) => (
                <div
                  key={s.step}
                  data-step={s.step}
                  className={`lx2-stage ${i <= active ? "is-active" : ""}`}
                >
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Pipeline>

      {/* ============ OFFERS: 3D tilt cards ============ */}
      <section className="lx2-section">
        <div className="lx2-container">
          <div className="lx2-section-head">
            <Reveal2>
              <span className="lx2-label">What we offer</span>
              <h2>Three ways in.</h2>
            </Reveal2>
          </div>
          <div className="lx2-cards">
            {OFFERS.map((o, i) => (
              <Reveal2 key={o.tag} delay={i * 0.1}>
                <TiltCard href={o.href}>
                  <span className="lx2-tag">{o.tag}</span>
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                  <span className="lx2-more">ENTER →</span>
                </TiltCard>
              </Reveal2>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="lx2-cta">
        <Reveal2>
          <span className="lx2-label">Begin</span>
          <h2>
            Bring us a problem where{" "}
            <span className="lx2-serif-accent">language</span> and data meet.
          </h2>
        </Reveal2>
        <Reveal2 delay={0.15}>
          <p>
            Join a workshop, enroll in a course, or start a project. The
            archive is open.
          </p>
        </Reveal2>
        <Reveal2 delay={0.3}>
          <div className="lx2-hero-ctas">
            <Magnetic>
              <Link href="/workshops" className="lx2-btn lx2-btn-amber">
                Upcoming workshops →
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/contact" className="lx2-btn lx2-btn-line">
                Contact us
              </Link>
            </Magnetic>
          </div>
        </Reveal2>
      </section>
    </div>
  );
}
