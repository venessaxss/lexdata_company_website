import CourseCard from "@/components/CourseCard";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select("id,title,slug,short_description,level,language,cover_url,categories(name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  const { data: courses } = await query;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="badge inline-block">LexData learning platform</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Course catalog</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Browse published LexData courses and workshops in Python, corpus development, NLP, statistics, visualization, and research methods.
      </p>

      <form className="mt-8 flex gap-3">
        <input name="q" defaultValue={q} className="input max-w-md" placeholder="Search course title..." />
        <button className="btn-primary">Search</button>
      </form>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {(courses ?? []).map((course: any) => <CourseCard key={course.id} course={course} />)}
      </div>
      {(!courses || courses.length === 0) ? <p className="mt-8 text-slate-600">No courses found.</p> : null}
    </section>
  );
}
