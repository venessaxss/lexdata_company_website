"use client";

/**
 * LexData motion primitives V2 — "Night Archive". Zero dependencies.
 * Scoped to lx2-* classes; safe to ship alongside components/motion.tsx (V1).
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

/* ---------- Reveal2: scroll-triggered fade/slide ---------- */
export function Reveal2({
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
      className={`lx2-reveal ${className}`}
      style={{ "--lx2-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ---------- CharReveal: headline appears character by character ---------- */
export function CharReveal({ text }: { text: string }) {
  return (
    <span className="lx2-chars" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ "--lx2-i": i } as CSSProperties}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

/* ---------- ScrollProgress: top bar filling with page scroll ---------- */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        el.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="lx2-progress" aria-hidden="true" />;
}

/* ---------- SpotlightSection: mouse-follow lamplight on the hero ---------- */
export function SpotlightSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--lx2-mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--lx2-my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <section ref={ref} className={className}>
      <div className="lx2-spot" aria-hidden="true" />
      {children}
    </section>
  );
}

/* ---------- GlyphGrid: faint field of multilingual glyphs ---------- */
const GLYPHS =
  "言 語 λ Σ ω ة ض ح あ ん 한 글 म ॐ ß Ж я δ φ ト 字 义 ñ ç ê ü ř α β θ π µ 学 文 訳".split(" ");

export function GlyphGrid({ count = 60 }: { count?: number }) {
  return (
    <div className="lx2-glyphgrid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{GLYPHS[i % GLYPHS.length]}</span>
      ))}
    </div>
  );
}

/* ---------- ScrollTicker: strip that moves with scroll velocity ---------- */
export function ScrollTicker({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translateX(${-(scrollY * 0.35) % (el.scrollWidth / 2)}px)`;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  const doubled = [...items, ...items];
  return (
    <div className="lx2-ticker" aria-hidden="true">
      <div ref={ref} className="lx2-ticker-track">
        {doubled.map((t, i) => (
          <span key={i}>
            <b>◆</b> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pipeline: sticky scroll-driven stage activation ---------- */
export function Pipeline({
  heightVh = 260,
  children,
}: {
  heightVh?: number;
  children: (progress: number, activeIndex: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const total = rect.height - innerHeight;
        const p = Math.min(Math.max(-rect.top / Math.max(total, 1), 0), 1);
        setProgress(p);
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  const activeIndex = Math.min(Math.floor(progress * 4), 3);
  return (
    <div ref={ref} className="lx2-pipeline" style={{ height: `${heightVh}vh` }}>
      <div className="lx2-pipeline-sticky">{children(progress, activeIndex)}</div>
    </div>
  );
}

/* ---------- TiltCard: pointer-tracking 3D tilt with glow ---------- */
export function TiltCard({
  children,
  href,
  className = "",
  max = 8,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg)`;
      el.style.setProperty("--lx2-cx", `${px * 100}%`);
      el.style.setProperty("--lx2-cy", `${py * 100}%`);
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);
  const cls = `lx2-tilt ${className}`;
  if (href) {
    return (
      <a ref={ref as any} href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <div ref={ref as any} className={cls}>
      {children}
    </div>
  );
}

/* ---------- Magnetic: button leans toward the cursor ---------- */
export function Magnetic({
  children,
  strength = 0.3,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = el.firstElementChild as HTMLElement | null;
    if (!target) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      target.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    };
    const onLeave = () => {
      target.style.transition = "transform .4s cubic-bezier(.22,1,.36,1)";
      target.style.transform = "";
      setTimeout(() => (target.style.transition = ""), 400);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);
  return (
    <div ref={ref} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
