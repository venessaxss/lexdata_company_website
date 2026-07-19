"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Stats = {
  workshops: number;
  registrations: number;
  users: number;
  notices: number;
};

type Notice = {
  id: string;
  title?: string | null;
  summary?: string | null;
  notice_type?: string | null;
};

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 36;
    const start = 0;
    const end = Number(value || 0);

    const timer = window.setInterval(() => {
      frame += 1;

      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(start + (end - start) * eased));

      if (frame >= totalFrames) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

function RotatingWords() {
  const words = useMemo(
    () => ["Research", "Workshops", "Data Skills", "AI Training", "Learning"],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <span className="relative inline-flex min-w-[180px] overflow-hidden align-bottom text-blue-300 md:min-w-[260px]">
      <span key={words[index]} className="animate-word-slide">
        {words[index]}
      </span>
    </span>
  );
}

export default function DynamicHomeShowcaseClient({
  stats,
  notices,
}: {
  stats: Stats;
  notices: Notice[];
}) {
  const tickerItems =
    notices.length > 0
      ? notices
      : [
          {
            id: "default-1",
            title: "Explore LexData workshops",
            notice_type: "Workshop",
          },
          {
            id: "default-2",
            title: "Build stronger research and data skills",
            notice_type: "Training",
          },
          {
            id: "default-3",
            title: "Follow new course and notice releases",
            notice_type: "Notice",
          },
        ];

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.25),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.22),transparent_32%)]" />

      <div className="absolute -left-24 top-20 h-72 w-72 animate-float rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 animate-float-delayed rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100 shadow-lg backdrop-blur">
              Dynamic LexData Platform
            </div>

            <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              A live platform for{" "}
              <RotatingWords />
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Track new workshops, notices, registrations, and learning updates
              through a more interactive and visually dynamic homepage.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/workshops"
                className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400"
              >
                Explore workshops
              </Link>

              <Link
                href="/notices"
                className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur hover:bg-white/15"
              >
                View notices
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-500/30 to-purple-500/20 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 text-slate-950">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Workshops
                  </p>
                  <p className="mt-3 text-4xl font-black">
                    <AnimatedNumber value={stats.workshops} />
                  </p>
                </div>

                <div className="rounded-3xl bg-blue-500 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Registrations
                  </p>
                  <p className="mt-3 text-4xl font-black">
                    <AnimatedNumber value={stats.registrations} />
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-900 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Members
                  </p>
                  <p className="mt-3 text-4xl font-black">
                    <AnimatedNumber value={stats.users} />
                  </p>
                </div>

                <div className="rounded-3xl bg-purple-500 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-100">
                    Notices
                  </p>
                  <p className="mt-3 text-4xl font-black">
                    <AnimatedNumber value={stats.notices} />
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                  Live notice feed
                </p>

                <div className="mt-4 space-y-3">
                  {tickerItems.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-2xl bg-white/10 px-4 py-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {notice.notice_type || "Notice"}
                      </p>
                      <p className="mt-1 font-bold text-white">
                        {notice.title || "Latest notice"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/10 py-3 backdrop-blur">
          <div className="animate-marquee whitespace-nowrap text-sm font-bold text-slate-200">
            {[...tickerItems, ...tickerItems].map((notice, idx) => (
              <span key={`${notice.id}-${idx}`} className="mx-8">
                <span className="text-blue-300">
                  {notice.notice_type || "Notice"}
                </span>{" "}
                · {notice.title || "Latest LexData update"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-24px) translateX(18px);
          }
        }

        @keyframes floatDelayed {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(20px) translateX(-18px);
          }
        }

        @keyframes wordSlide {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          20% {
            transform: translateY(0%);
            opacity: 1;
          }
          80% {
            transform: translateY(0%);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatDelayed 9s ease-in-out infinite;
        }

        .animate-word-slide {
          display: inline-block;
          animation: wordSlide 1.8s ease-in-out;
        }

        .animate-marquee {
          display: inline-block;
          min-width: 200%;
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </section>
  );
}