export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteCourse } from "./actions";

export default async function AdminCoursesPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      slug,
      is_published,
      is_home_highlighted,
      home_highlight_order,
      updated_at,
      categories(name)
    `
    )
    .order("updated_at", { ascending: false });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin: courses</h1>

          <p className="mt-2 text-slate-600">
            Create, edit, publish, highlight, and update LexData courses.
          </p>
        </div>

        <Link href="/admin/courses/new" className="btn-primary">
          New course
        </Link>
      </div>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4">Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Homepage</th>
              <th>Order</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {(courses ?? []).map((course: any) => {
              const deleteAction = deleteCourse.bind(null, course.id);

              return (
                <tr key={course.id} className="border-t border-slate-100">
                  <td className="p-4 font-medium text-slate-950">
                    {course.title}
                  </td>

                  <td>{course.categories?.name ?? "-"}</td>

                  <td>
                    {course.is_published ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        Draft
                      </span>
                    )}
                  </td>

                  <td>
                    {course.is_home_highlighted ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Highlighted
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>

                  <td>{course.home_highlight_order ?? 0}</td>

                  <td>
                    {course.updated_at
                      ? new Date(course.updated_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="flex flex-wrap gap-2 py-3 pr-4">
                    <Link href={`/courses/${course.slug}`} className="btn-light">
                      View
                    </Link>

                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="btn-light"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/admin/courses/${course.id}/lessons`}
                      className="btn-light"
                    >
                      Lessons
                    </Link>

                    <form action={deleteAction}>
                      <button className="btn-light">Delete</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(!courses || courses.length === 0) ? (
        <p className="mt-8 text-slate-600">No courses found.</p>
      ) : null}
    </section>
  );
}