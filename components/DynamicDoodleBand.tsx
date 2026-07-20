"use client";

import { useEffect, useRef } from "react";

export default function DynamicDoodleBand() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      root.style.setProperty("--doodle-x", String(x));
      root.style.setProperty("--doodle-y", String(y));
    };

    const leave = () => {
      root.style.setProperty("--doodle-x", "0");
      root.style.setProperty("--doodle-y", "0");
    };

    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={rootRef} className="lx-doodle-band">
      <div className="lx-doodle-collab" aria-hidden="true">
        <div className="lx-avatar-stack">
          <span>R</span><span>L</span><span>D</span>
        </div>
        <svg className="lx-collab-arrow" viewBox="0 0 150 70" fill="none">
          <path d="M138 50C108 20 61 18 17 32" />
          <path d="M29 20 15 32l16 9" />
        </svg>
        <p>That is us, collaborating.</p>
      </div>

      <div className="lx-doodle-copy">
        <p>One connected workspace</p>
        <h2>Dashboards, drafts, cases, and discussions</h2>
        <span>
          Keep serious research organized without making the interface feel corporate.
          Move from research to review to feedback in one visual flow.
        </span>
      </div>

      <div className="lx-doodle-object lx-doodle-books-cup" aria-hidden="true">
        <svg viewBox="0 0 290 240" fill="none">
          <path d="M37 190h164" />
          <path d="M55 169h130v21H55z" />
          <path d="M67 145h111v24H67z" />
          <path d="M81 120h89v25H81z" />
          <path d="M98 62v53" />
          <path d="M98 75h53v47H98z" />
          <path d="M151 83c24 0 28 31 3 33" />
          <path d="M119 50c-6-14 7-20 1-33" />
        </svg>
      </div>

      <div className="lx-doodle-object lx-doodle-lamp-plant" aria-hidden="true">
        <svg viewBox="0 0 340 300" fill="none">
          <path d="M238 54 290 25l26 45-50 30z" />
          <path d="m275 94-44 87" />
          <path d="M230 180h53" />
          <path d="M255 181v64" />
          <path d="M225 245h64" />
          <path d="M59 223h95" />
          <path d="M78 223l-9-57h72l-8 57" />
          <path d="M95 166c-32-19-28-58 4-57 24 1 31 30 16 50" />
          <path d="M113 166c28-23 48-6 40 17-5 17-22 28-35 29" />
          <path d="M107 165c-2-38 22-55 41-36 15 15 2 36-20 49" />
        </svg>
      </div>
    </div>
  );
}