"use client";

import { useEffect, useState } from "react";

type PhoneFrameProps = {
  shots: string[];
  intervalMs?: number;
};

export default function PhoneFrame({ shots, intervalMs = 3000 }: PhoneFrameProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (shots.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % shots.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [shots.length, intervalMs]);

  return (
    <div className="mqp-phone">
      <span className="mqp-side mqp-side-power" aria-hidden="true" />
      <span className="mqp-side mqp-side-vol" aria-hidden="true" />

      <div className="mqp-bezel">
        <span className="mqp-notch" aria-hidden="true" />

        <div className="mqp-screen">
          <div
            className="mqp-track"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {shots.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`MedQuiz screenshot ${index + 1}`}
                draggable={false}
              />
            ))}
          </div>
        </div>

        <span className="mqp-glare" aria-hidden="true" />
      </div>
    </div>
  );
}