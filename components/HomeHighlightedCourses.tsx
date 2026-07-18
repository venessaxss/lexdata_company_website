import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type HighlightedCourse = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  intro?: string | null;
  level?: string | null;
  language?: string | null;
  cover_url?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  home_badge?: string | null;
  home_cta?: string | null;
  home_highlight_order?: number | null;
};

function money(cents?: number | null, currency?: string | null) {
  if (!cents || cents <= 0) return "Free";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(cents / 100);
}

export default async function HomeHighlightedCourses() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("courses")
    .select(
      `
      id,
      title,
      slug,
      short_description,
      intro,
      level,
      language,
      cover_url,
      price_cents,
      currency,
      home_badge,
      home_cta,
      home_highlight_order
    `
    )
    .eq("is_published", true)
    .eq("is_home_highlighted", true)
    .order("home_highlight_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Home highlighted courses error:", error.message);
    return null;
  }

  const courses = (data ?? []) as HighlightedCourse[];

  if (courses.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              Highlighted LexData Course
            </p>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Build practical AI, research, and data skills through guided
              learning.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore selected LexData courses designed for researchers,
              students, educators, and professionals.
            </p>
          </div>

          <Link
            href="/courses"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            View all courses
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-52 bg-slate-900">
                {course.cover_url ? (
                  <img
                    src={course.cover_url}
                    alt={course.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-black text-white">
                    LexData
                  </div>
                )}
              </div>

              <div className="p-7">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {course.home_badge || "Featured Course"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {course.level || "All Levels"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {course.language || "English"}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-950 group-hover:text-blue-700">
                  {course.title}
                </h3>

                <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">
                  {course.short_description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="text-lg font-black text-slate-950">
                    {money(course.price_cents, course.currency)}
                  </p>

                  <span className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white">
                    {course.home_cta || "View Course"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}