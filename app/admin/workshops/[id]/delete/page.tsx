import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteWorkshop } from "@/app/admin/workshops/actions";

export default async function DeleteWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: workshop } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .single();

  if (!workshop) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Delete Workshop
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Are you sure you want to delete this workshop?
        </h1>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h2 className="text-xl font-bold text-slate-900">
            {workshop.title}
          </h2>

          {workshop.level ? (
            <p className="mt-2 text-sm text-slate-600">
              Level: {workshop.level}
            </p>
          ) : null}

          {workshop.format ? (
            <p className="mt-2 text-sm text-slate-600">
              Format: {workshop.format}
            </p>
          ) : null}

          {workshop.start_date ? (
            <p className="mt-2 text-sm text-slate-600">
              Start date: {workshop.start_date}
            </p>
          ) : null}

          {workshop.short_description || workshop.description ? (
            <p className="mt-3 text-slate-600">
              {workshop.short_description || workshop.description}
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-sm leading-6 text-red-600">
          This action will permanently remove the workshop from the website.
          This cannot be undone.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/admin/workshops"
            className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <form action={deleteWorkshop}>
            <input type="hidden" name="id" value={workshop.id} />

            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
            >
              Delete Workshop
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}