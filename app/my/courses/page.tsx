import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/unauthorized");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,status,created_at,courses(id,title,slug,short_description,level,language)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Purchased courses</h1>
      <p className="mt-2 text-slate-600">Courses you have enrolled in or purchased.</p>

      <div className="mt-8 grid gap-4">
        {(enrollments ?? []).map((item: any) => (
          <div key={item.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="badge">{item.status}</p>
                <h2 className="mt-3 text-xl font-semibold">{item.courses?.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.courses?.short_description}</p>
                <p className="mt-2 text-xs text-slate-500">{item.courses?.level} · {item.courses?.language}</p>
              </div>
              <Link href={`/courses/${item.courses?.slug}`} className="btn-primary">Continue</Link>
            </div>
          </div>
        ))}

        {(!enrollments || enrollments.length === 0) ? (
          <div className="card p-6 text-slate-600">
            You have not purchased or enrolled in any course yet. <Link href="/courses" className="font-semibold underline">Browse courses</Link>.
          </div>
        ) : null}
      </div>
    </section>
  );
}
