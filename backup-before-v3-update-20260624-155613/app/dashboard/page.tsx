import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,created_at,courses(id,title,slug,short_description)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("id,completed,lessons(course_id)")
    .eq("user_id", userData.user.id)
    .eq("completed", true);

  function completedCount(courseId: string) {
    return (progress ?? []).filter((p: any) => p.lessons?.course_id === courseId).length;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="badge inline-block">Student area</p>
      <h1 className="mt-4 text-3xl font-bold">My LexData learning dashboard</h1>
      <p className="mt-2 text-slate-600">Your enrolled courses, workshop lessons, and learning progress.</p>
      <div className="mt-8 grid gap-4">
        {(enrollments ?? []).map((enrollment: any) => (
          <div key={enrollment.id} className="card p-5">
            <h2 className="font-semibold">{enrollment.courses?.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{enrollment.courses?.short_description}</p>
            <p className="mt-3 text-sm text-slate-500">Completed lessons: {completedCount(enrollment.courses?.id)}</p>
            <Link href={`/courses/${enrollment.courses?.slug}`} className="mt-3 inline-block text-sm font-medium text-indigo-950">Continue →</Link>
          </div>
        ))}
        {(!enrollments || enrollments.length === 0) ? (
          <div className="card p-5 text-slate-600">No enrollments yet. <Link href="/courses" className="font-semibold text-indigo-950">Browse the LexData course catalog.</Link></div>
        ) : null}
      </div>
    </section>
  );
}
