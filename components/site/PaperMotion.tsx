"use client";

/**
 * PaperMotion — the entire motion for the paper & ink style.
 * Mount once in app/layout.tsx (first child of <body>).
 * Gentle by design: reveals (.rev), arrow/check draw-ons (.draw),
 * sticky-nav shadow. Everything else is CSS (float bobbing, hover
 * wiggles, marquee). Respects prefers-reduced-motion via the CSS.
 */
import { useEffect } from "react";

export function PaperMotion() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("header.site");
    const onScroll = () => nav?.classList.toggle("scrolled", scrollY > 10);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

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
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
