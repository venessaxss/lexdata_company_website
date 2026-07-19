"use client";

/**
 * LexData motion primitives — zero dependencies.
 * Reveal, Counter, WordCycler, Parallax, StickyNavEffect, CorpusField
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

/* ---------------- Reveal: scroll-triggered fade/slide ---------------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`ld-reveal ${className}`}
      style={{ "--ld-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ---------------- Counter: animates a number when in view ---------------- */
export function Counter({
  to,
  suffix = "",
  duration = 1600,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (reduced) return setValue(to);
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <b ref={ref}>
      {value.toLocaleString()}
      <em>{suffix}</em>
    </b>
  );
}

/* ---------------- WordCycler: hero word translating across languages ---------------- */
export function WordCycler({
  words,
  interval = 3200,
}: {
  words: { text: string; lang: string }[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const cycle = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setPhase("in");
      }, 350);
    }, interval);
    return () => clearInterval(cycle);
  }, [words.length, interval]);
  const current = words[index];
  return (
    <span className="ld-cycle">
      <span className="ld-cycle-lang">{current.lang}</span>
      <span
        key={index + phase}
        className={`ld-cycle-word ${phase === "out" ? "is-out" : "is-in"}`}
      >
        {current.text}
      </span>
    </span>
  );
}

/* ---------------- Parallax: shifts children on scroll ---------------- */
export function Parallax({
  children,
  speed = 0.25,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ---------------- StickyNavEffect: toggles .is-scrolled on the nav ---------------- */
export function StickyNavEffect({ targetId = "ld-nav" }: { targetId?: string }) {
  useEffect(() => {
    const nav = document.getElementById(targetId);
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);
  return null;
}

/* ---------------- CorpusField: drifting multilingual background lines ---------------- */
const CORPUS_LINES = [
  "language · 语言 · lengua · لغة · langue · sprache · 언어 · भाषा · lugha · dil ·",
  "data → tokens → annotation → corpus → model → insight → data → tokens →",
  "translation · 翻译 · traducción · ترجمة · traduction · übersetzung · 번역 ·",
  "education · 教育 · educación · تعليم · éducation · bildung · 교육 · शिक्षा ·",
  "society · 社会 · sociedad · مجتمع · société · gesellschaft · 사회 · समाज ·",
  "humanities × data science × humanities × data science × humanities ×",
];

export function CorpusField() {
  return (
    <div className="ld-corpus" aria-hidden="true">
      {CORPUS_LINES.map((line, i) => (
        <span
          key={i}
          style={{
            top: `${8 + i * 15}%`,
            left: 0,
            fontSize: `${13 + (i % 3) * 3}px`,
            animationDuration: `${46 + i * 14}s`,
            animationDirection: i % 2 ? "reverse" : "normal",
          }}
        >
          {(line + " ").repeat(6)}
        </span>
      ))}
    </div>
  );
}
