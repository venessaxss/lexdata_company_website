import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/app/checkout/actions";

function money(cents: number, currency: string) {
  if (!cents || cents <= 0) return "Free";
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default async function CourseDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ message?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug,short_description,intro,level,language,cover_url,is_published,updated_at,price_cents,currency")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,content,video_url,position")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("position");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="card overflow-hidden">
        <div className="h-64 bg-slate-200">
          {course.cover_url ? <img src={course.cover_url} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-8">
          <p className="text-sm text-slate-500">{course.level ?? "All levels"} · {course.language ?? "English"}</p>
          <h1 className="mt-2 text-4xl font-bold">{course.title}</h1>
          <p className="mt-4 text-lg text-slate-600">{course.short_description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-2xl font-bold">{money(course.price_cents, course.currency)}</p>
            <form action={createCheckout}>
              <input type="hidden" name="product_type" value="course" />
              <input type="hidden" name="product_id" value={course.id} />
              <button className="btn-primary">Enroll / Pay</button>
            </form>
          </div>
          {sp.message ? <p className="mt-4 text-sm text-red-600">{sp.message}</p> : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[0.7fr_0.3fr]">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold">Course introduction</h2>
          <p className="mt-4 whitespace-pre-line text-slate-700">{course.intro}</p>
        </div>
        <aside className="card p-6">
          <h2 className="font-semibold">Lessons</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {(lessons ?? []).map((lesson: any) => (
              <li key={lesson.id}>
                <Link href={`/courses/${course.slug}/lessons/${lesson.id}`} className="hover:underline">
                  {lesson.position}. {lesson.title}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
