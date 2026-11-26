"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import "./AppShowcase.css";

// Change the extension here if your files are .webp or .jpg
const SHOTS = [
  "01.jpg",
  "02.jpg",
  "03.jpg",
  "04.jpg",
  "05.jpg",
  "06.jpg",
  "07.jpg",
  "08.jpg",
].map((file) => `/app-showcase/medquiz/${file}`);

const SLIDE_MS = 3000;

const FEATURES = [
  { title: "10,012 MCQs", text: "With explanations, working 100% offline." },
  { title: "Progress tracking", text: "Quiz history, scores and accuracy by subject and topic." },
  { title: "Bookmarks and streak", text: "Save questions and keep your daily study streak going." },
  { title: "Daily reminder", text: "An optional study reminder at 8:00 PM." },
  { title: "Dark and light themes", text: "Switch to whichever mode suits your study time." },
  { title: "No ads, no account", text: "No in-app purchases, no login, no personal data sent to any server." },
];

const FEATURE_MS = 3200;
const MORE_URL = "https://dailwind.com/apps/medquiz/";
// When the Play Store link is ready, paste it here and the button turns on
const PLAY_URL = "";

export default function AppShowcase() {
  const [active, setActive] = useState(0);
  const [feature, setFeature] = useState(0);
  const phoneRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [reveal, setReveal] = useState<"off" | "armed" | "in">("off");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SHOTS.length);
    }, SLIDE_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
  const el = sectionRef.current;
  if (!el || typeof IntersectionObserver === "undefined") return;

  // Already on screen when the page loads: skip the entrance animation
  if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

  setReveal("armed");

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setReveal("in");
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );

  observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
  const timer = window.setInterval(() => {
    setFeature((current) => (current + 1) % FEATURES.length);
  }, FEATURE_MS);

    return () => window.clearInterval(timer);
  }, [feature]);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const phone = phoneRef.current;
    if (!phone) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    phone.style.setProperty("--ry", `${x * 28}deg`);
    phone.style.setProperty("--rx", `${-y * 18}deg`);
  };

  const handleLeave = () => {
    const phone = phoneRef.current;
    if (!phone) return;

    phone.style.removeProperty("--ry");
    phone.style.removeProperty("--rx");
  };

  return (
      <section
      ref={sectionRef}
      className={`mq-section${reveal === "armed" ? " mq-armed" : ""}${reveal === "in" ? " mq-in" : ""}`}
      id="medquiz"
      aria-label="MedQuiz app preview"
      >
      <div className="mq-inner">
        <div className="mq-stage" onMouseMove={handleMove} onMouseLeave={handleLeave}>
          <div className="mq-float">
            <div className="mq-phone" ref={phoneRef}>
              <span className="mq-side mq-side-power" aria-hidden="true" />
              <span className="mq-side mq-side-vol" aria-hidden="true" />

              <div className="mq-bezel">
                <span className="mq-notch" aria-hidden="true" />

                <div className="mq-screen">
                  <div
                    className="mq-track"
                    style={{ transform: `translateX(-${active * 100}%)` }}
                  >
                    {SHOTS.map((src, index) => (
                      <img
                        key={src}
                        src={src}
                        alt={`MedQuiz screenshot ${index + 1}`}
                        draggable={false}
                      />
                    ))}
                  </div>
                </div>

                <span className="mq-glare" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="mq-shadow" aria-hidden="true" />

          <div className="mq-dots">
            {SHOTS.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Show screenshot ${index + 1}`}
                className={index === active ? "is-active" : ""}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </div>

        <div className="mq-copy">
          <span className="mq-badge">Coming Soon &middot; Android</span>
          <h2>MedQuiz</h2>
          <p>
            Offline medical MCQ practice for exam preparation. 10,012 MCQs with
            explanations, progress statistics and a daily study reminder, all on
            your device.
          </p>
          <div className="mq-features">
            <p className="mq-features-label">Key features</p>

            <div className="mq-feature-stage" aria-live="polite">
              <h3 key={`title-${feature}`}>{FEATURES[feature].title}</h3>
              <span key={`text-${feature}`}>{FEATURES[feature].text}</span>
            </div>

            <ul className="mq-feature-list">
              {FEATURES.map((item, index) => (
                <li key={item.title}>
                  <button
                    type="button"
                    className={index === feature ? "is-active" : ""}
                    onClick={() => setFeature(index)}
                  >
                    {index === feature ? (
                      <i
                        key={`bar-${feature}`}
                        className="mq-progress"
                        style={{ animationDuration: `${FEATURE_MS}ms` }}
                      />
                    ) : null}
                    <b>{item.title}</b>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mq-actions">
            <a
              className="mq-btn mq-btn-primary"
              href={MORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>

            {PLAY_URL ? (
              <a
                className="mq-btn mq-btn-ghost"
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get it on Google Play
              </a>
            ) : (
              <span className="mq-btn mq-btn-ghost mq-btn-disabled" aria-disabled="true">
                Google Play &middot; Coming soon
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}