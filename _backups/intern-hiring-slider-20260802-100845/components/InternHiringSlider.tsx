"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

const slides = [
  {
    eyebrow: "CISMA x LexData",
    title: "Interns wanted",
    summary: "Join an interdisciplinary team working across academic research, language data, AI, education, and digital communication.",
    bullets: ["Flexible internship format", "Project-based experience", "Mentoring and portfolio support"],
    footer: "Applications are reviewed on a rolling basis.",
  },
  {
    eyebrow: "Choose a track",
    title: "Research, content, or technology",
    summary: "Contribute according to your interests, skills, and academic background.",
    bullets: ["Research and data support", "Content and communications", "Web, platform, and workshop support"],
    footer: "Select one primary track and one secondary interest.",
  },
  {
    eyebrow: "What you may work on",
    title: "Build useful work, not busywork",
    summary: "Projects connect to real LexData and CISMA research, learning, and public-engagement activities.",
    bullets: ["Literature, corpus, and data preparation", "Workshop materials and participant support", "Website content, media, and visual communication"],
    footer: "Tasks are assigned according to experience and availability.",
  },
  {
    eyebrow: "Who should apply",
    title: "Curious, reliable, and ready to learn",
    summary: "University students and recent graduates from diverse academic and technical backgrounds are welcome.",
    bullets: ["Strong communication and responsibility", "English working ability", "Chinese or Mongolian is an advantage"],
    footer: "A portfolio or GitHub profile is helpful but not required.",
  },
  {
    eyebrow: "Application details",
    title: "Tell us what you want to build",
    summary: "Prepare a short application that helps us understand your interests and availability.",
    bullets: ["CV or one-page resume", "Short introduction and preferred track", "Availability plus portfolio or GitHub link"],
    footer: "Open the details page to submit your application.",
  },
];

export default function InternHiringSlider() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (requestedIndex: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const index = (requestedIndex + slides.length) % slides.length;
    const elements = viewport.querySelectorAll<HTMLElement>("[data-intern-slide]");

    elements[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIndex(index);
  };

  const syncActiveIndex = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const elements = Array.from(viewport.querySelectorAll<HTMLElement>("[data-intern-slide]"));
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    elements.forEach((element, index) => {
      const distance = Math.abs(element.offsetLeft + element.offsetWidth / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pauseRef.current) scrollToIndex(activeIndex + 1);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    pauseRef.current = true;
    dragRef.current = { active: true, startX: event.clientX, scrollLeft: viewport.scrollLeft };
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !dragRef.current.active) return;

    viewport.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragRef.current.active = false;
    pauseRef.current = false;

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    syncActiveIndex();
  };

  return (
    <section id="internships" className="overflow-hidden bg-black py-20 text-white sm:py-24">
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6">
        <div className="flex flex-col gap-6 px-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-400">Careers and opportunities</p>
            <h2 className="mt-3 font-serif text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl">
              Start your next project with CISMA and LexData.
            </h2>
          </div>

          <div className="max-w-xl lg:text-right">
            <p className="text-sm leading-7 text-white/65 sm:text-base">
              Explore the internship poster, available tracks, expected work, applicant profile, and application checklist.
            </p>
            <Link href="/careers/internship" className="mt-5 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5">
              View internship details
            </Link>
          </div>
        </div>

        <div className="relative mt-12">
          <button type="button" aria-label="Previous internship poster" onClick={() => scrollToIndex(activeIndex - 1)} className="absolute left-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/55 text-3xl text-white backdrop-blur transition hover:bg-white hover:text-black sm:left-8">
            <span aria-hidden="true">&larr;</span>
          </button>

          <div
            ref={viewportRef}
            onScroll={syncActiveIndex}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onMouseEnter={() => { pauseRef.current = true; }}
            onMouseLeave={() => { pauseRef.current = false; }}
            className="cursor-grab overflow-x-auto overscroll-x-contain scroll-smooth pb-4 active:cursor-grabbing"
            style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
          >
            <div className="flex w-max gap-5 px-[8vw] sm:gap-8 sm:px-[18vw]">
              {slides.map((slide, index) => (
                <div
                  key={slide.title}
                  data-intern-slide
                  className={`flex min-h-[520px] w-[84vw] max-w-[960px] shrink-0 items-center justify-center rounded-[30px] bg-[#287bc1] px-4 py-12 transition duration-500 sm:w-[68vw] sm:px-10 ${index === activeIndex ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"}`}
                  style={{ scrollSnapAlign: "center" }}
                >
                  <article className="relative mx-auto flex min-h-[390px] w-[min(86%,560px)] flex-col overflow-hidden rounded-[24px] bg-[#fffdf8] px-7 py-8 text-[#090b1d] shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:min-h-[430px] sm:px-10 sm:py-10">
                    <div className="absolute right-6 top-5 text-xs font-black tracking-[0.2em] text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">{slide.eyebrow}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Internship opportunity</p>
                      </div>
                      <div className="rounded-full bg-[#081020] px-4 py-2 text-xs font-black text-white">OPEN CALL</div>
                    </div>

                    <h3 className="mt-7 max-w-[460px] font-serif text-4xl font-black leading-[0.98] tracking-[-0.035em] sm:text-5xl">{slide.title}</h3>
                    <p className="mt-5 max-w-[500px] text-sm font-medium leading-6 text-slate-700 sm:text-base">{slide.summary}</p>

                    <ul className="mt-6 grid gap-3">
                      {slide.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800">
                          <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto border-t border-slate-200 pt-5">
                      <p className="text-xs font-bold leading-5 text-slate-500">{slide.footer}</p>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

          <button type="button" aria-label="Next internship poster" onClick={() => scrollToIndex(activeIndex + 1)} className="absolute right-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/55 text-3xl text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-8">
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button key={slide.title} type="button" aria-label={`Open internship poster ${index + 1}`} onClick={() => scrollToIndex(index)} className={`h-2.5 rounded-full transition ${index === activeIndex ? "w-10 bg-white" : "w-2.5 bg-white/35"}`} />
            ))}
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
              {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em]">Intern applications open</p>
          </div>
        </div>
      </div>
    </section>
  );
}