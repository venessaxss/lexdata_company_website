import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import HomeVideoSpotlight from "@/components/HomeVideoSpotlight";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import TeamShowcase from "@/components/TeamShowcase";

const featureCards = [
  {
    title: "Python & Data Skills",
    description:
      "Learn practical Python, data cleaning, visualization, automation, and applied research workflows.",
  },
  {
    title: "Corpus & NLP Research",
    description:
      "Build, clean, annotate, and analyze text corpora for language sciences and social science research.",
  },
  {
    title: "AI-assisted Research",
    description:
      "Use modern AI tools for literature review, coding support, analysis planning, and academic reporting.",
  },
];

const programCards = [
  {
    label: "Courses",
    title: "Structured learning paths",
    description:
      "Follow organized courses designed for students, researchers, teachers, and professionals.",
    href: "/courses",
    button: "Explore Courses",
  },
  {
    label: "Workshops",
    title: "Live practical training",
    description:
      "Join focused workshops on Python, AI, NLP, corpus research, academic writing, and digital methods.",
    href: "/workshops",
    button: "Explore Workshops",
  },
  {
    label: "Services",
    title: "Research support services",
    description:
      "Get support for data preparation, analysis workflows, training design, and research reporting.",
    href: "/services",
    button: "View Services",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <HomeVideoSpotlight />

      <LatestWorkshopVideos />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              LexData Offers
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Practical research, AI, Python, and data skills for modern
              learners.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              LexData helps researchers, students, educators, and professionals
              learn applied digital research skills through courses, workshops,
              and hands-on training.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featureCards.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                Programs
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Learn through courses, workshops, and guided research support.
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {programCards.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
                  {item.label}
                </p>

                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {item.description}
                </p>

                <Link
                  href={item.href}
                  className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  {item.button}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TeamShowcase />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-slate-950 px-8 py-14 text-white shadow-xl md:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              Start Learning
            </p>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              Build practical research, AI, Python, and data skills with
              LexData.
            </h2>

            <p className="mt-5 max-w-2xl text-slate-300">
              Explore our courses and workshops designed for language sciences,
              social sciences, education, translation, and digital research.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/courses"
                className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-100"
              >
                Explore Courses
              </Link>

              <Link
                href="/workshops"
                className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/10"
              >
                Explore Workshops
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/10"
              >
                Contact LexData
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}