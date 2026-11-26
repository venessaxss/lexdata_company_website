"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";
import Link from "next/link";
import PhoneFrame from "./PhoneFrame";
import { MEDQUIZ_SHOTS, MEDQUIZ_PLAY_URL } from "@/lib/medquiz";

export default function MedQuizHero() {
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    stage.style.setProperty("--ry", `${x * 30}deg`);
    stage.style.setProperty("--rx", `${-y * 20}deg`);
  };

  const handleLeave = () => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.style.removeProperty("--ry");
    stage.style.removeProperty("--rx");
  };

  return (
    <section className="mqp-hero" aria-label="MedQuiz introduction">
      <div className="mqp-grid-bg" aria-hidden="true" />

      <div className="mqp-hero-inner">
        <div className="mqp-hero-copy">
          <nav className="mqp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Services</span>
            <span>/</span>
            <b>MedQuiz</b>
          </nav>

          <span className="mqp-badge">Coming Soon &middot; Android</span>

          <h1>MedQuiz</h1>

          <p className="mqp-tagline">
            Offline medical MCQ practice for exam preparation.
          </p>

          <p className="mqp-lead">
            10,012 MCQs with explanations, progress statistics and a daily study
            reminder, all on your device. No ads, no account, no internet needed.
          </p>

          <div className="mqp-actions">
            <a className="mqp-btn mqp-btn-primary" href="#features">
              See features
            </a>

            {MEDQUIZ_PLAY_URL ? (
              <a
                className="mqp-btn mqp-btn-ghost"
                href={MEDQUIZ_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get it on Google Play
              </a>
            ) : (
              <span className="mqp-btn mqp-btn-ghost mqp-btn-disabled" aria-disabled="true">
                Google Play &middot; Coming soon
              </span>
            )}
          </div>
        </div>

        <div
          className="mqp-stage"
          ref={stageRef}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        >
          <div className="mqp-ring" aria-hidden="true" />

          <div className="mqp-float">
            <div className="mqp-sway">
              <div className="mqp-tilt">
                <PhoneFrame shots={MEDQUIZ_SHOTS} />

                <span className="mqp-chip mqp-chip-a">10,012 MCQs</span>
                <span className="mqp-chip mqp-chip-b">100% offline</span>
                <span className="mqp-chip mqp-chip-c">No ads</span>
              </div>
            </div>
          </div>

          <div className="mqp-ground" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}