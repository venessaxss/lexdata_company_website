import Link from "next/link";
import { internHiringSlides } from "@/content/internHiring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InternshipDetailsPage() {
  const poster = internHiringSlides[0]?.poster;

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/#internships"
          className="text-sm font-black text-slate-600 hover:text-slate-950"
        >
          &larr; Back to internship posters
        </Link>

        <section className="overflow-hidden rounded-[32px] bg-black text-white shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-400">
                CISMA x LexData
              </p>

              <h1 className="mt-4 font-serif text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-7xl">
                Interns wanted.
              </h1>

              <p className="mt-6 text-lg leading-8 text-white/70">
                Join projects involving academic research,
                language data, AI, workshops, digital
                communication, and platform development.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">
                  Flexible format
                </span>
                <span className="rounded-full border border-white/25 px-4 py-2 text-sm font-black">
                  Rolling review
                </span>
                <span className="rounded-full border border-white/25 px-4 py-2 text-sm font-black">
                  Portfolio experience
                </span>
              </div>

              <Link
                href="/contact"
                className="mt-8 inline-flex rounded-xl bg-blue-500 px-6 py-4 text-sm font-black text-white"
              >
                Contact LexData to apply
              </Link>
            </div>

            <div className="flex min-h-[500px] items-center justify-center bg-[#287bc1] p-7">
              {poster ? (
                <img
                  src={poster}
                  alt="CISMA and LexData internship poster"
                  className="max-h-[680px] w-full max-w-lg rounded-[22px] bg-white object-contain shadow-2xl"
                />
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            [
              "Research and data",
              "Literature review, corpus preparation, data cleaning, documentation, and research-oriented AI workflows.",
            ],
            [
              "Content and communications",
              "Website copy, workshop announcements, bilingual materials, media, and visual communication.",
            ],
            [
              "Web and platform support",
              "Website updates, content organization, testing, documentation, and digital workshop operations.",
            ],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-black text-slate-950">
                {title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}