"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const lines = [
  "language 路 璇█ 路 lengua 路 賱睾丞 路 langue 路 sprache 路 鞏胳柎 路 啶ぞ啶粪ぞ 路 lugha 路 dil 路 ",
  "data ->tokens ->annotation ->corpus ->model ->insight ->data ->tokens ->",
  "translation 路 缈昏瘧 路 traducci贸n 路 鬲乇噩賲丞 路 traduction 路 眉bersetzung 路 氩堨棴 路 ",
  "education 路 鏁欒偛 路 educaci贸n 路 鬲毓賱賷賲 路 茅ducation 路 bildung 路 甑愳湣 路 啶多た啶曕啶粪ぞ 路 ",
  "society 路 绀句細 路 sociedad 路 賲噩鬲賲毓 路 soci茅t茅 路 gesellschaft 路 靷殞 路 啶膏ぎ啶距 路 ",
  "humanities 脳 data science 脳 humanities 脳 data science 脳 humanities 脳 ",
];

const words = [
  ["Language", "EN"],
  ["璇█", "ZH"],
  ["Lengua", "ES"],
  ["丕賱賱睾丞", "AR"],
  ["Langue", "FR"],
  ["鞏胳柎", "KO"],
  ["啶ぞ啶粪ぞ", "HI"],
  ["Sprache", "DE"],
];

export default function LexDataAnimatedHero() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setVisible(true);
      }, 250);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const [word, lang] = words[index];

  return (
    <section className="ld-page">
      <div className="ld-hero ld-home-hero">
        <div className="ld-corpus" aria-hidden="true">
          {lines.map((line, i) => (
            <span
              key={line}
              style={{
                top: `${8 + i * 15}%`,
                left: 0,
                fontSize: `${13 + (i % 3) * 3}px`,
                animationDuration: `${46 + i * 14}s`,
                animationDirection: i % 2 ? "reverse" : "normal",
              }}
            >
              {line.repeat(6)}
            </span>
          ))}
        </div>

        <div className="ld-container">
          <div className="ld-reveal is-visible">
            <span className="ld-eyebrow">
              Intelligent data solutions 路 language / translation / education /
              society
            </span>
          </div>

          <div className="ld-reveal is-visible" style={{ transitionDelay: ".1s" }}>
            <h1 className="ld-display">
              Where{" "}
              <span className="ld-cycle">
                <span className="ld-cycle-lang">{lang}</span>
                <span
                  className={`ld-cycle-word ${
                    visible ? "is-in" : "is-out"
                  }`}
                >
                  {word}
                </span>
              </span>{" "}
              meets data science.
            </h1>
          </div>

          <div className="ld-reveal is-visible" style={{ transitionDelay: ".2s" }}>
            <p className="ld-hero-sub">
              LexData bridges the humanities and data science for real-world
              impact 鈥?turning text, translation, and teaching into intelligent,
              measurable systems.
            </p>
          </div>

          <div className="ld-reveal is-visible" style={{ transitionDelay: ".3s" }}>
            <div className="ld-hero-ctas">
              <Link href="/courses" className="ld-btn ld-btn-primary">
                Explore courses <span className="ld-arrow">-&gt;</span>
              </Link>

              <Link href="/services" className="ld-btn ld-btn-ghost">
                Our services
              </Link>

              <Link href="/workshops" className="ld-btn ld-btn-ghost">
                Workshops
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

