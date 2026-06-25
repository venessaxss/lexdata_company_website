import Link from "next/link";
import PromoCarousel from "@/components/PromoCarousel";
import MediaGallery from "@/components/MediaGallery";
import { createClient } from "@/lib/supabase/server";

import SessionHighlights from "@/components/SessionHighlights";
import TeamShowcase from "@/components/TeamShowcase";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: promotionsData } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: mediaData } = await supabase
    .from("media_items")
    .select("*")
    .eq("is_active", true)
    .eq("page_area", "home_gallery")
    .order("sort_order", { ascending: true });

  const now = new Date();

  const promotions = (promotionsData || []).filter((item) => {
    const startsOk = !item.starts_at || new Date(item.starts_at) <= now;
    const endsOk = !item.ends_at || new Date(item.ends_at) >= now;
    return startsOk && endsOk;
  });

  const mediaItems = mediaData || [];

  const { data: highlightsData } = await supabase
  .from("session_highlights")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true });

  const { data: teamData } = await supabase
  .from("team_members")
  .select("*")
  .eq("is_active", true)
  .eq("is_featured", true)
  .order("sort_order", { ascending: true });

  const highlights = highlightsData || [];
  const featuredTeam = teamData || [];

  return (
    <main>
      <PromoCarousel promotions={promotions} />
      <SessionHighlights highlights={highlights} />

      <TeamShowcase members={featuredTeam} />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="font-semibold text-blue-700">LexData Academy</p>

            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              Built for research, education, and real-world data practice
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-slate-600">
              LexData helps students, teachers, researchers, and institutions
              develop practical data skills for language sciences, translation,
              education, ELT, and social sciences.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-xl font-bold">Corpus Development</h3>

              <p className="mt-3 text-slate-600">
                Build, clean, organize, annotate, and analyze language and
                social data for academic and institutional projects.
              </p>
            </div>

            <div className="rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-xl font-bold">Workshops & Training</h3>

              <p className="mt-3 text-slate-600">
                Practical training in Python, NLP, data visualization, research
                methods, AI tools, and academic writing.
              </p>
            </div>

            <div className="rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-xl font-bold">Research Consulting</h3>

              <p className="mt-3 text-slate-600">
                Support for data analysis, publication preparation, research
                design, reporting, and digital research workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-semibold text-blue-700">Featured Training</p>

            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              Python for Language Sciences and Social Sciences
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Learn how to collect textual data, clean datasets, build research
              corpora, perform basic NLP, visualize findings, and prepare
              research reports.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/courses"
                className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white"
              >
                View Courses
              </Link>

              <Link
                href="/workshops"
                className="rounded-xl border px-6 py-3 font-semibold text-slate-950"
              >
                View Workshops
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-blue-50 p-5">
                Python + Research Data
              </div>

              <div className="rounded-2xl bg-slate-100 p-5">
                Corpus Building + NLP
              </div>

              <div className="rounded-2xl bg-slate-100 p-5">
                SPSS, R, Power BI
              </div>

              <div className="rounded-2xl bg-slate-100 p-5">
                Academic Writing + Publication Support
              </div>
            </div>
          </div>
        </div>
      </section>

      <MediaGallery items={mediaItems} />

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Start building real research data skills with LexData
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Explore courses, workshops, consulting support, and dynamic learning
            resources for research and education.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/courses"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
            >
              Browse Courses
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}