"use client";

/**
 * LexData Motion Layer PRO — heavy dynamics, still attribute-driven.
 * Zero dependencies.
 *
 * Mount ONCE in app/layout.tsx, wrapping your pages:
 *
 *   import MotionLayerPro from "@/components/dynamic/MotionLayerPro";
 *   <body className={...unchanged...}>
 *     <YourNavbar />                        // fixed chrome stays OUTSIDE
 *     <MotionLayerPro intro cursor smooth
 *       introWords={["Language","语言","Lengua","اللغة","Data."]}>
 *       {children}                          // your original pages
 *     </MotionLayerPro>
 *   </body>
 *
 * Attributes (add to your existing JSX — pages stay server components):
 *   data-scrub-y="-60"      translateY scrub tied to scroll progress (px)
 *   data-scrub-x="-14"      translateX scrub (vw)
 *   data-scrub-rotate="12"  rotation scrub (deg)
 *   data-scrub-scale="0.15" scale scrub (1 → 1+value)
 *   data-split              split into words, rise on page load
 *   data-split-view         split into words, rise when scrolled into view
 *   data-view               gets .in-view when visible (pair with CSS below)
 *   data-tilt               pointer-tracking 3D tilt
 *   data-theme="dark|light" body theme morphs as this section passes center
 *   data-pin="300"          pin section for 300vh of scrolling
 *   data-pin-track          (child of pinned section) scrolls horizontally
 *   data-pin-fill           (child) progress bar filled by pin progress
 *   data-marquee-velocity   marquee whose speed & skew react to scroll speed
 *
 * Props: smooth (inertia scroll), cursor (custom cursor), intro (preloader),
 * introWords, lerp (0..1 smoothing, default .085).
 *
 * prefers-reduced-motion disables smooth scroll, cursor, intro, and scrubs.
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export default function MotionLayerPro({
  children,
  smooth = true,
  cursor = true,
  intro = true,
  introWords = ["Language", "语言", "Lengua", "اللغة", "Langue", "언어", "Data."],
  lerp = 0.085,
}: {
  children: ReactNode;
  smooth?: boolean;
  cursor?: boolean;
  intro?: boolean;
  introWords?: string[];
  lerp?: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderWordRef = useRef<HTMLDivElement>(null);
  const loaderBarRef = useRef<HTMLDivElement>(null);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document.documentElement;
    doc.setAttribute("data-motion-pro", "on");
    const content = contentRef.current!;
    const useSmooth = smooth && !reduced;

    /* ---------- preloader ---------- */
    let booted = false;
    const boot = () => {
      if (booted) return;
      booted = true;
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) =>
        el.classList.add("mlp-split-on")
      );
    };
    let introTimer: ReturnType<typeof setInterval> | undefined;
    if (intro && !reduced && loaderRef.current) {
      let i = 0;
      introTimer = setInterval(() => {
        i++;
        if (i >= introWords.length) {
          clearInterval(introTimer);
          loaderRef.current?.classList.add("mlp-done");
          setTimeout(() => setLoaderGone(true), 1000);
          boot();
          return;
        }
        if (loaderWordRef.current) loaderWordRef.current.textContent = introWords[i];
        if (loaderBarRef.current)
          loaderBarRef.current.style.width = `${(i / (introWords.length - 1)) * 100}%`;
      }, 220);
    } else {
      setLoaderGone(true);
      boot();
    }

    /* ---------- split text ---------- */
    const splitEl = (el: HTMLElement) => {
      if (el.dataset.mlpSplitDone) return;
      el.dataset.mlpSplitDone = "1";
      const words = (el.textContent ?? "").trim().split(/\s+/);
      el.textContent = "";
      const line = document.createElement("span");
      line.className = "mlp-split-line";
      words.forEach((word, i) => {
        const s = document.createElement("span");
        s.className = "mlp-split-word";
        s.style.setProperty("--w", String(i));
        s.innerHTML = word + (i < words.length - 1 ? "&nbsp;" : "");
        line.appendChild(s);
      });
      el.appendChild(line);
    };
    document
      .querySelectorAll<HTMLElement>("[data-split],[data-split-view]")
      .forEach(splitEl);

    /* ---------- in-view observer ---------- */
    const viewIO = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            viewIO.unobserve(e.target);
          }
        }),
      { threshold: 0.2 }
    );
    document
      .querySelectorAll("[data-view],[data-split-view]")
      .forEach((el) => viewIO.observe(el));

    /* ---------- tilt ---------- */
    const tiltCleanups: (() => void)[] = [];
    if (!reduced)
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          el.style.transform = `rotateY(${(px - 0.5) * 14}deg) rotateX(${(0.5 - py) * 14}deg)`;
        };
        const onLeave = () => (el.style.transform = "");
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        tiltCleanups.push(() => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        });
      });

    /* ---------- cursor ---------- */
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    const onPointer = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const hoverCleanups: (() => void)[] = [];
    if (cursor && !reduced) {
      doc.setAttribute("data-cursor-pro", "on");
      addEventListener("pointermove", onPointer);
      document.querySelectorAll<HTMLElement>("a,button,[data-cursor]").forEach((el) => {
        const enter = () => ringRef.current?.classList.add("mlp-hovering");
        const leave = () => ringRef.current?.classList.remove("mlp-hovering");
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
        hoverCleanups.push(() => {
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    /* ---------- smooth scroll bookkeeping ---------- */
    let ro: ResizeObserver | undefined;
    if (useSmooth) {
      content.classList.add("mlp-smooth");
      const setH = () => (document.body.style.height = content.scrollHeight + "px");
      ro = new ResizeObserver(setH);
      ro.observe(content);
      setH();
    }

    /* ---------- collect scroll-driven elements ---------- */
    const scrubs = [...document.querySelectorAll<HTMLElement>(
      "[data-scrub-y],[data-scrub-x],[data-scrub-rotate],[data-scrub-scale]"
    )];
    const pins = [...document.querySelectorAll<HTMLElement>("[data-pin]")].map((pin) => {
      pin.style.height = `${100 + Number(pin.dataset.pin ?? 200)}vh`;
      const stage = pin.firstElementChild as HTMLElement | null;
      if (stage) stage.classList.add("mlp-pin-stage");
      return {
        pin,
        stage,
        track: pin.querySelector<HTMLElement>("[data-pin-track]"),
        fill: pin.querySelector<HTMLElement>("[data-pin-fill]"),
        len: (Number(pin.dataset.pin ?? 200) / 100),
      };
    });
    const themeSections = [...document.querySelectorAll<HTMLElement>("[data-theme]")];
    const vmarquees = [...document.querySelectorAll<HTMLElement>("[data-marquee-velocity]")].map((el) => {
      let track = el.querySelector<HTMLElement>(".mlp-vtrack");
      if (!track) {
        track = document.createElement("div");
        track.className = "mlp-vtrack";
        const inner = document.createElement("div");
        inner.style.display = "inherit";
        inner.style.gap = "inherit";
        while (el.firstChild) inner.appendChild(el.firstChild);
        track.appendChild(inner);
        track.appendChild(inner.cloneNode(true));
        el.appendChild(track);
      }
      return { track, x: 0 };
    });

    /* ---------- master rAF loop ---------- */
    let current = scrollY, last = current, raf = 0, running = true;
    const frame = () => {
      if (!running) return;
      const targetY = scrollY;
      current = useSmooth ? current + (targetY - current) * lerp : targetY;
      if (Math.abs(targetY - current) < 0.05) current = targetY;
      if (useSmooth) content.style.transform = `translate3d(0, ${-current}px, 0)`;
      const velocity = current - last;
      last = current;

      const max = (useSmooth ? content.scrollHeight : doc.scrollHeight) - innerHeight;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${max > 0 ? current / max : 0})`;
      doc.classList.toggle("mlp-scrolled", current > 24);

      if (!reduced)
        for (const el of scrubs) {
          const r = el.getBoundingClientRect();
          const p = Math.min(Math.max(1 - ((r.top + r.height / 2) / innerHeight) * 1.2 + 0.1, 0), 1);
          const t: string[] = [];
          if (el.dataset.scrubY) t.push(`translateY(${p * Number(el.dataset.scrubY)}px)`);
          if (el.dataset.scrubX) t.push(`translateX(${p * Number(el.dataset.scrubX)}vw)`);
          if (el.dataset.scrubRotate) t.push(`rotate(${p * Number(el.dataset.scrubRotate)}deg)`);
          if (el.dataset.scrubScale) t.push(`scale(${1 + p * Number(el.dataset.scrubScale)})`);
          el.style.transform = t.join(" ");
        }

      for (const { pin, stage, track, fill, len } of pins) {
        const topY = useSmooth
          ? (pin as HTMLElement).offsetTop
          : (pin.getBoundingClientRect().top + current);
        const lenPx = len * innerHeight;
        const p = Math.min(Math.max((current - topY) / lenPx, 0), 1);
        if (stage && useSmooth)
          stage.style.transform = `translateY(${Math.min(Math.max(current - topY, 0), lenPx)}px)`;
        if (track) {
          const shift = track.scrollWidth - innerWidth + 48;
          track.style.transform = `translateX(${-p * Math.max(shift, 0)}px)`;
        }
        if (fill) fill.style.transform = `scaleX(${p})`;
      }
      /* non-smooth mode: sticky handles pinning */
      if (!useSmooth) pins.forEach(({ stage }) => stage?.classList.add("mlp-pin-native"));

      for (const m of vmarquees) {
        m.x -= 0.6 + Math.abs(velocity) * 0.6;
        const half = m.track.scrollWidth / 2;
        if (-m.x > half) m.x += half;
        const skew = Math.max(Math.min(-velocity * 0.4, 12), -12);
        m.track.style.transform = `translateX(${m.x}px) skewX(${reduced ? 0 : skew}deg)`;
      }

      let theme = "light";
      for (const s of themeSections) {
        const r = s.getBoundingClientRect();
        if (r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5)
          theme = s.dataset.theme ?? "light";
      }
      doc.classList.toggle("mlp-dark", theme === "dark");

      if (cursor && !reduced && dotRef.current && ringRef.current) {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        dotRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (introTimer) clearInterval(introTimer);
      viewIO.disconnect();
      ro?.disconnect();
      tiltCleanups.forEach((fn) => fn());
      hoverCleanups.forEach((fn) => fn());
      removeEventListener("pointermove", onPointer);
      document.body.style.height = "";
      content.classList.remove("mlp-smooth");
      content.style.transform = "";
      doc.removeAttribute("data-motion-pro");
      doc.removeAttribute("data-cursor-pro");
      doc.classList.remove("mlp-dark", "mlp-scrolled");
    };
  }, [smooth, cursor, intro, lerp, introWords]);

  return (
    <>
      {intro && !loaderGone && (
        <div ref={loaderRef} className="mlp-loader">
          <div ref={loaderWordRef} className="mlp-loader-word">
            {introWords[0]}
          </div>
          <div ref={loaderBarRef} className="mlp-loader-bar" />
        </div>
      )}
      <div ref={progressRef} className="mlp-progress" aria-hidden="true" />
      {cursor && (
        <>
          <div ref={ringRef} className="mlp-cursor-ring" aria-hidden="true" />
          <div ref={dotRef} className="mlp-cursor-dot" aria-hidden="true" />
        </>
      )}
      <div ref={contentRef} className="mlp-content">
        {children}
      </div>
    </>
  );
}
