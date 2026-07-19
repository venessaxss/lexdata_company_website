import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type Course = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  level?: string | null;
  language?: string | null;
  cover_url?: string | null;
  price_cents?: number | null;
  currency?: string | null;
};

function money(cents?: number | null, currency?: string | null) {
  if (!cents || cents <= 0) return "Free";
  return `${(currency || "USD").toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

export default async function HomeV2FeaturedCourses() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("courses")
    .select(
      "id,title,slug,short_description,level,language,cover_url,price_cents,currency,is_published,is_home_highlighted,home_highlight_order"
    )
    .eq("is_published", true)
    .order("is_home_highlighted", { ascending: false })
    .order("home_highlight_order", { ascending: true })
    .limit(3);

  if (error) {
    console.error("HomeV2FeaturedCourses error:", error.message);
    return null;
  }

  const courses = (data ?? []) as Course[];

  if (courses.length === 0) return null;

  return (
    <section className="v2-section">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-label">Highlighted LexData courses</p>
            <h2>Build practical AI, research, and data skills.</h2>
            <p>
              Explore selected LexData courses designed for researchers,
              students, educators, and professionals.
            </p>
          </div>

          <Link href="/courses" className="v2-pill-button">
            View all courses
          </Link>
        </div>

        <div className="v2-course-grid">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="v2-course-card"
            >
              <div className="v2-course-image">
                {course.cover_url ? (
                  <img src={course.cover_url} alt={course.title} />
                ) : (
                  <div className="v2-course-fallback">LexData</div>
                )}
              </div>

              <div className="v2-course-body">
                <div className="v2-card-tags">
                  <span>{course.level || "All levels"}</span>
                  <span>{course.language || "English"}</span>
                </div>

                <h3>{course.title}</h3>

                <p>{course.short_description}</p>

                <div className="v2-card-bottom">
                  <b>{money(course.price_cents, course.currency)}</b>
                  <span>Open -&gt;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}