"use client";

/**
 * Shared motion for the paper-and-ink surfaces. It keeps reveals and
 * pointer depth subtle, throttled, and respectful of reduced-motion settings.
 */
import { useEffect } from "react";

export function PaperMotion() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("header.site, header.lx-site-nav");
    const page = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scrollFrame = 0;
    let pointerFrame = 0;

    const onScroll = () => {
      nav?.classList.toggle("scrolled", scrollY > 10);
      if (scrollFrame || reducedMotion.matches) return;
      scrollFrame = window.requestAnimationFrame(() => {
        page.style.setProperty("--lx-scroll-y", String(window.scrollY));
        scrollFrame = 0;
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerFrame || reducedMotion.matches || event.pointerType === "touch") return;
      pointerFrame = window.requestAnimationFrame(() => {
        const x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
        const y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
        page.style.setProperty("--lx-pointer-x", x.toFixed(3));
        page.style.setProperty("--lx-pointer-y", y.toFixed(3));
        pointerFrame = 0;
      });
    };

    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onPointerMove, { passive: true });

    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          e.target.querySelectorAll(".draw").forEach((d) => d.classList.add("in"));
          io.unobserve(e.target);
        }),
      { threshold: 0.2 }
    );
    const scan = (root: ParentNode) =>
      root.querySelectorAll(".rev").forEach((el) => io.observe(el));
    scan(document);

    /* keep working across client-side navigations */
    const mo = new MutationObserver((muts) =>
      muts.forEach((m) =>
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const el = n as HTMLElement;
          if (el.matches?.(".rev")) io.observe(el);
          scan(el);
        })
      )
    );
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onPointerMove);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
