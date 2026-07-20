/**
 * LexData — dynamic homepage
 * Drop-in replacement for app/page.tsx
 * Requires: components/motion.tsx and app/lexdata-theme.css (see INTEGRATION.md)
 */

import Link from "next/link";
import {
  Reveal,
  Counter,
  WordCycler,
  Parallax,
  StickyNavEffect,
  CorpusField,
} from "@/components/motion";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/courses", label: "Courses" },
  { href: "/workshops", label: "Workshops" },
  { href: "/contact", label: "Contact" },
];

const HERO_WORDS = [
  { text: "Language", lang: "EN" },
  { text: "语言", lang: "ZH" },
  { text: "Lengua", lang: "ES" },
  { text: "اللغة", lang: "AR" },
  { text: "Langue", lang: "FR" },
  { text: "언어", lang: "KO" },
  { text: "भाषा", lang: "HI" },
  { text: "Sprache", lang: "DE" },
];

const SERVICES = [
  {
    index: "L-01",
    title: "Language data",
    body: "Corpus construction, annotation pipelines, and multilingual dataset engineering built to research standards.",
  },
  {
    index: "L-02",
    title: "Translation technology",
    body: "MT evaluation, terminology systems, and human-in-the-loop workflows for translation teams.",
  },
  {
    index: "L-03",
    title: "Education",
    body: "Courses and curricula that take humanities students from spreadsheets to working NLP pipelines.",
  },
  {
    index: "L-04",
    title: "Society & research",
    body: "Computational methods for social questions — text mining, discourse analytics, and open data for public good.",
  },
];

const COURSES = [
  {
    glyph: "语",
    tag: "CORPUS-101",
    title: "Corpus Linguistics with Python",
    body: "Build, clean, and query your first research corpus — no CS degree required.",
    meta: "8 lessons · beginner",
  },
  {
    glyph: "Ā",
    tag: "MT-201",
    title: "Machine Translation in Practice",
    body: "How modern MT works, where it fails, and how to evaluate it like a professional.",
    meta: "10 lessons · intermediate",
  },
  {
    glyph: "ذ",
    tag: "DH-110",
    title: "Data Science for the Humanities",
    body: "Statistics, visualization, and text mining framed around real humanities questions.",
    meta: "12 lessons · beginner",
  },
];

export default function Home() {
  return (
    <div className="ld-page">
      <StickyNavEffect />

      {/* ================= NAV ================= */}
      <header id="ld-nav" className="ld-nav">
        <div className="ld-container ld-nav-inner">
          <Link href="/" className="ld-logo">
            Lex<em>Data</em>
          </Link>
          <nav className="ld-nav-links">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="ld-btn ld-btn-primary">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="ld-hero">
        <CorpusField />
        <div className="ld-container">
          <Reveal>
            <span className="ld-eyebrow">
              Intelligent data solutions · language / translation / education / society
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="ld-display">
              Where <WordCycler words={HERO_WORDS} /> meets data science.
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="ld-hero-sub">
              LexData bridges the humanities and data science for real-world
              impact — turning text, translation, and teaching into intelligent,
              measurable systems.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="ld-hero-ctas">
              <Link href="/courses" className="ld-btn ld-btn-primary">
                Explore courses <span className="ld-arrow">→</span>
              </Link>
              <Link href="/services" className="ld-btn ld-btn-ghost">
                Our services
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="ld-scrollcue">SCROLL</div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="ld-marquee" aria-hidden="true">
        <div className="ld-marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy}>
              Corpus linguistics <i>◆</i> Machine translation <i>◆</i> NLP for
              the humanities <i>◆</i> Terminology <i>◆</i> Digital pedagogy{" "}
              <i>◆</i> Text mining <i>◆</i> Open social data <i>◆</i>
            </span>
          ))}
        </div>
      </div>

      {/* ================= SERVICES ================= */}
      <section className="ld-section">
        <div className="ld-container">
          <div className="ld-section-head">
            <Reveal>
              <span className="ld-eyebrow">What we do</span>
              <h2 className="ld-display">Four practices, one method.</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p>
                Every engagement follows the same arc: corpus → annotation →
                model → insight. The domain changes; the rigor doesn&apos;t.
              </p>
            </Reveal>
          </div>
          <div className="ld-grid">
            {SERVICES.map((s, i) => (
              <Reveal key={s.index} delay={i * 0.08}>
                <div className="ld-card">
                  <span className="ld-card-index">{s.index}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="ld-section" style={{ paddingTop: 0 }}>
        <div className="ld-container">
          <Reveal>
            <div className="ld-stats">
              <div className="ld-stat">
                <Counter to={24} suffix="+" />
                <span>Languages covered</span>
              </div>
              <div className="ld-stat">
                <Counter to={18} suffix="" />
                <span>Courses & workshops</span>
              </div>
              <div className="ld-stat">
                <Counter to={1200} suffix="+" />
                <span>Learners enrolled</span>
              </div>
              <div className="ld-stat">
                <Counter to={40} suffix="M" />
                <span>Tokens annotated</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= COURSES ================= */}
      <section className="ld-section" style={{ paddingTop: 0 }}>
        <div className="ld-container">
          <div className="ld-section-head">
            <Reveal>
              <span className="ld-eyebrow">Featured courses</span>
              <h2 className="ld-display">Learn the bridge, not just the code.</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <Link href="/courses" className="ld-btn ld-btn-ghost">
                Full catalog <span className="ld-arrow">→</span>
              </Link>
            </Reveal>
          </div>
          <div className="ld-grid">
            {COURSES.map((c, i) => (
              <Reveal key={c.tag} delay={i * 0.08}>
                <Link href="/courses" className="ld-course">
                  <div className="ld-course-art" data-glyph={c.glyph}>
                    {c.tag}
                  </div>
                  <div className="ld-course-body">
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                    <div className="ld-course-meta">{c.meta}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA BAND ================= */}
      <section className="ld-band">
        <Parallax speed={0.18} className="ld-band-glyphs">
          <i style={{ top: "6%", left: "6%" }}>言</i>
          <i style={{ top: "58%", left: "14%" }}>Ω</i>
          <i style={{ top: "14%", right: "10%" }}>ض</i>
          <i style={{ top: "62%", right: "6%" }}>ॐ</i>
        </Parallax>
        <Reveal>
          <h2 className="ld-display">
            Bridging humanities and data science for{" "}
            <mark>real-world impact</mark>.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p>
            Join a workshop, enroll in a course, or bring us a problem where
            language and data meet.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="ld-hero-ctas" style={{ justifyContent: "center" }}>
            <Link
              href="/workshops"
              className="ld-btn ld-btn-primary"
              style={{ background: "var(--ld-ink)" }}
            >
              Upcoming workshops <span className="ld-arrow">→</span>
            </Link>
            <Link href="/contact" className="ld-btn ld-btn-ghost">
              Contact us
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="ld-footer">
        <div className="ld-container">
          <div className="ld-footer-grid">
            <div>
              <Link href="/" className="ld-logo">
                Lex<em>Data</em>
              </Link>
              <p style={{ opacity: 0.6, marginTop: 14, maxWidth: "34ch", lineHeight: 1.6 }}>
                Intelligent data solutions for language, translation, education
                &amp; society.
              </p>
            </div>
            <nav>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
          <div className="ld-footer-bottom">
            <span>© {new Date().getFullYear()} LexData</span>
            <span>corpus → annotation → model → insight</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
