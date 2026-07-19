import Link from "next/link";

export default function MouCollaborationSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-12 text-white md:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-blue-300">
                MoU & Collaboration
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                Build academic bridges with LexData.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                We welcome universities, research centers, laboratories,
                journals, training institutes, and professional organizations
                to collaborate on workshops, research training, data-driven
                language studies, AI literacy, and academic capacity building.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white hover:bg-blue-700"
                >
                  Propose Collaboration
                </Link>

                <Link
                  href="/workshops"
                  className="rounded-2xl border border-white/20 px-6 py-4 text-sm font-black text-white hover:bg-white/10"
                >
                  Explore Workshops
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/10">
                <p className="text-xl font-black">Institutional MoU</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Partner with LexData for training programs, academic events,
                  research collaboration, and student development initiatives.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/10">
                <p className="text-xl font-black">Joint Workshops</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Co-host short courses, expert lectures, summer camps,
                  publication training, corpus methods, and AI-assisted
                  research programs.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/10">
                <p className="text-xl font-black">Research & Data Projects</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Collaborate on applied linguistics, legal language,
                  multimodal data, discourse analysis, corpus research, and
                  responsible AI in education.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}