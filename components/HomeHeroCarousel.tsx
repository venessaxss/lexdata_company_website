"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type HomeHeroSlide = {
  id: string;
  badge?: string | null;
  title: string;
  subtitle?: string | null;
  primary_button_text?: string | null;
  primary_button_href?: string | null;
  secondary_button_text?: string | null;
  secondary_button_href?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  mobile_media_url?: string | null;
  overlay_opacity?: number | null;
};

type HomeHeroCarouselProps = {
  slides: HomeHeroSlide[];
};

const fallbackSlides: HomeHeroSlide[] = [
  {
    id: "fallback-python",
    badge: "New Workshop",
    title: "Python for Language Sciences and Social Sciences",
    subtitle:
      "Learn Python, corpus building, NLP, data visualization, and research reporting with LexData.",
    primary_button_text: "Join the Course",
    primary_button_href: "/courses",
    secondary_button_text: "Contact LexData",
    secondary_button_href: "/contact",
    media_type: "recommended",
    media_url: null,
    overlay_opacity: 0.7,
  },
];

export default function HomeHeroCarousel({ slides }: HomeHeroCarouselProps) {
  const safeSlides = useMemo(
    () => (slides.length > 0 ? slides : fallbackSlides),
    [slides]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = safeSlides[activeIndex];

  useEffect(() => {
    if (safeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [safeSlides.length]);

  const overlayOpacity = activeSlide.overlay_opacity ?? 0.68;

  return (
    <section className="relative min-h-[760px] overflow-hidden bg-slate-950">
      {safeSlides.map((slide, index) => {
        const isActive = index === activeIndex;
        const mediaUrl = slide.media_url;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.media_type === "video" && mediaUrl ? (
              <video
                src={mediaUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : slide.media_type === "image" && mediaUrl ? (
              <img
                src={mediaUrl}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_#1d4ed8,_transparent_35%),linear-gradient(135deg,_#020617,_#0f172a_45%,_#1e3a8a)]" />
            )}

            <div
              className="absolute inset-0 bg-slate-950"
              style={{ opacity: overlayOpacity }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/65 to-transparent" />
          </div>
        );
      })}

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 py-24">
        <div className="max-w-3xl">
          {activeSlide.badge ? (
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-blue-100 shadow-lg backdrop-blur">
              {activeSlide.badge}
            </div>
          ) : null}

          <h1 className="mt-8 text-5xl font-black tracking-tight text-white md:text-7xl">
            {activeSlide.title}
          </h1>

          {activeSlide.subtitle ? (
            <p className="mt-7 max-w-2xl text-xl leading-9 text-slate-200">
              {activeSlide.subtitle}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            {activeSlide.primary_button_text &&
            activeSlide.primary_button_href ? (
              <Link
                href={activeSlide.primary_button_href}
                className="rounded-xl bg-white px-7 py-4 text-base font-black text-slate-950 shadow-xl hover:bg-slate-100"
              >
                {activeSlide.primary_button_text}
              </Link>
            ) : null}

            {activeSlide.secondary_button_text &&
            activeSlide.secondary_button_href ? (
              <Link
                href={activeSlide.secondary_button_href}
                className="rounded-xl border border-white/25 bg-white/5 px-7 py-4 text-base font-black text-white backdrop-blur hover:bg-white/10"
              >
                {activeSlide.secondary_button_text}
              </Link>
            ) : null}
          </div>

          {safeSlides.length > 1 ? (
            <div className="mt-12 flex gap-3">
              {safeSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-3 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-12 bg-white"
                      : "w-3 bg-white/35 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}