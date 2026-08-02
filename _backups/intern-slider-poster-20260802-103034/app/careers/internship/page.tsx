import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const tracks = [
  ["Research and data", "Literature review, corpus preparation, data cleaning, documentation, and research-oriented AI workflows."],
  ["Content and communications", "Website copy, workshop announcements, social posts, bilingual materials, and visual communication."],
  ["Web and platform support", "Website updates, content organization, testing, documentation, and digital workshop operations."],
];

export default function InternshipDetailsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link href="/#internships" className="text-sm font-black text-slate-600 hover:text-slate-950">&larr; Back to internship posters</Link>

        <section className="overflow-hidden rounded-[32px] bg-black text-white shadow-2xl">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-400">CISMA x LexData</p>
              <h1 className="mt-4 font-serif text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-7xl">Interns wanted.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                Join interdisciplinary projects involving academic research, language data, AI, workshops, digital communication, and platform development.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Flexible format</span>
                <span className="rounded-full border border-white/25 px-4 py-2 text-sm font-black">Rolling review</span>
                <span className="rounded-full border border-white/25 px-4 py-2 text-sm font-black">Portfolio experience</span>
              </div>
            </div>

            <div className="flex items-center justify-center bg-[#287bc1] p-7 sm:p-10">
              <div className="w-full max-w-md rounded-[24px] bg-[#fffdf8] p-7 text-[#090b1d] shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Application checklist</p>
                <h2 className="mt-4 font-serif text-4xl font-black leading-none">Tell us what you want to build.</h2>
                <ul className="mt-7 space-y-3">
                  {["CV or one-page resume", "Short introduction", "Preferred internship track", "Weekly availability", "Portfolio or GitHub link, when available"].map((item) => (
                    <li key={item} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black">{item}</li>
                  ))}
                </ul>
                <Link href="/contact" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white">Contact LexData to apply</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {tracks.map(([title, description]) => (
            <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Internship track</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}