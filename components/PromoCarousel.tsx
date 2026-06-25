"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Promotion = {
  id: string;
  badge: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

export default function PromoCarousel({
  promotions,
}: {
  promotions: Promotion[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (promotions.length <= 1) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % promotions.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [promotions.length]);

  if (!promotions.length) return null;

  const item = promotions[active];

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        {item.video_url ? (
          <video
            src={item.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-40"
          />
        ) : item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-950 to-blue-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {item.badge && (
          <p className="mb-4 inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 ring-1 ring-blue-300/30">
            {item.badge}
          </p>
        )}

        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          {item.title}
        </h1>

        {item.subtitle && (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {item.subtitle}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={item.cta_href || "/courses"}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-blue-100"
          >
            {item.cta_label || "Learn More"}
          </Link>

          <Link
            href="/contact"
            className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Contact LexData
          </Link>
        </div>

        {promotions.length > 1 && (
          <div className="mt-10 flex gap-2">
            {promotions.map((promotion, index) => (
              <button
                key={promotion.id}
                onClick={() => setActive(index)}
                className={`h-2 rounded-full transition-all ${
                  index === active ? "w-10 bg-white" : "w-2 bg-white/40"
                }`}
                aria-label={`Show promotion ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}