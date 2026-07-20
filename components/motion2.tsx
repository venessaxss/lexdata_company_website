"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;

      if (height <= 0) {
        setProgress(0);
        return;
      }

      setProgress(Math.min(1, Math.max(0, scrollTop / height)));
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div
      className="lx2-scroll-progress"
      style={{ "--lx2-scroll": progress } as CSSProperties}
    />
  );
}

export function Reveal2({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.16 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lx2-reveal ${visible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function CharReveal({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="lx2-char"
          style={{ "--lx2-i": index } as CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}

export function SpotlightSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function handleMove(event: MouseEvent) {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      element.style.setProperty("--lx2-mx", `${x}px`);
      element.style.setProperty("--lx2-my", `${y}px`);
    }

    element.addEventListener("mousemove", handleMove);

    return () => {
      element.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <section ref={ref} className={`lx2-spotlight ${className}`}>
      {children}
    </section>
  );
}

export function GlyphGrid() {
  const glyphs = "AI NLP DATA TEXT LANG CORPUS MODEL TOKEN CODE".split(" ");

  return (
    <div className="lx2-glyph-grid" aria-hidden="true">
      {Array.from({ length: 90 }).map((_, index) => (
        <span key={index}>{glyphs[index % glyphs.length]}</span>
      ))}
    </div>
  );
}

export function ScrollTicker({ items }: { items: string[] }) {
  const safeItems = items.length > 0 ? items : ["LexData"];

  return (
    <div className="lx2-ticker" aria-hidden="true">
      <div className="lx2-ticker-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="lx2-ticker-row">
            {safeItems.map((item, index) => (
              <span key={`${copy}-${item}-${index}`}>
                {item}
                <i>*</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pipeline({
  children,
  heightVh = 240,
}: {
  children: (progress: number, active: number) => ReactNode;
  heightVh?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function updateProgress() {
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;

      if (total <= 0) {
        setProgress(0);
        return;
      }

      const raw = -rect.top / total;
      setProgress(Math.min(1, Math.max(0, raw)));
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const active = Math.min(3, Math.floor(progress * 4));

  return (
    <section
      ref={ref}
      className="lx2-pipeline"
      style={{ minHeight: `${heightVh}vh` }}
    >
      <div className="lx2-pipeline-sticky">{children(progress, active)}</div>
    </section>
  );
}

export function TiltCard({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function handleMove(event: MouseEvent) {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--lx2-rx", `${-py * 8}deg`);
      element.style.setProperty("--lx2-ry", `${px * 8}deg`);
    }

    function handleLeave() {
      element.style.setProperty("--lx2-rx", "0deg");
      element.style.setProperty("--lx2-ry", "0deg");
    }

    element.addEventListener("mousemove", handleMove);
    element.addEventListener("mouseleave", handleLeave);

    return () => {
      element.removeEventListener("mousemove", handleMove);
      element.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <Link ref={ref} href={href} className="lx2-tilt-card">
      {children}
    </Link>
  );
}

export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function handleMove(event: MouseEvent) {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    }

    function handleLeave() {
      element.style.transform = "translate(0px, 0px)";
    }

    element.addEventListener("mousemove", handleMove);
    element.addEventListener("mouseleave", handleLeave);

    return () => {
      element.removeEventListener("mousemove", handleMove);
      element.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div ref={ref} className="lx2-magnetic">
      {children}
    </div>
  );
}