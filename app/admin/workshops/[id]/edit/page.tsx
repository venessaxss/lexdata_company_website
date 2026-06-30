import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshop } from "@/app/admin/workshops/actions";

export default async function EditWorkshopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { message } = await searchParams;

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin/workshops"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>

        <h1 className="mt-4 text-3xl font-black text-slate-950">
          Edit Workshop
        </h1>

        <p className="mt-2 text-slate-600">
          Modify workshop details, level, publication status, and material link.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <form action={updateWorkshop} className="space-y-5">
        <input type="hidden" name="id" value={workshop.id} />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Workshop title
          </label>
          <input
            name="title"
            required
            defaultValue={workshop.title ?? ""}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Slug
          </label>
          <input
            name="slug"
            defaultValue={workshop.slug ?? ""}
            placeholder="auto-generated-if-empty"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Level
          </label>
          <select
            name="level"
            defaultValue={workshop.level ?? "Beginner"}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Short description
          </label>
          <textarea
            name="short_description"
            defaultValue={
              workshop.short_description ?? workshop.summary ?? ""
            }
            rows={3}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Full description
          </label>
          <textarea
            name="description"
            defaultValue={workshop.description ?? ""}
            rows={8}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Instructor / Speaker
          </label>
          <input
            name="instructor"
            defaultValue={workshop.instructor ?? workshop.speaker ?? ""}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Format
            </label>
            <select
              name="format"
              defaultValue={workshop.format ?? "Online"}
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              name="location"
              defaultValue={workshop.location ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Start date
            </label>
            <input
              name="start_date"
              type="date"
              defaultValue={workshop.start_date ?? workshop.date ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              End date
            </label>
            <input
              name="end_date"
              type="date"
              defaultValue={workshop.end_date ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Duration
          </label>
          <input
            name="duration"
            defaultValue={workshop.duration ?? ""}
            placeholder="e.g. 3 weeks / 12 hours"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Price
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={workshop.price ?? 0}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Currency
            </label>
            <input
              name="currency"
              defaultValue={workshop.currency ?? "USD"}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Capacity
            </label>
            <input
              name="capacity"
              type="number"
              defaultValue={workshop.capacity ?? 0}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Cover image URL
          </label>
          <input
            name="image_url"
            defaultValue={
              workshop.image_url ??
              workshop.cover_url ??
              workshop.thumbnail_url ??
              ""
            }
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Material URL
          </label>
          <input
            name="material_url"
            defaultValue={
              workshop.material_url ??
              workshop.materials_url ??
              workshop.resource_url ??
              workshop.file_url ??
              ""
            }
            placeholder="Paste uploaded material URL here"
            className="w-full rounded-xl border px-4 py-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            For large files, upload directly to Supabase Storage and paste the
            public URL here.
          </p>
        </div>

        <label className="flex items-center gap-2">
          <input
            name="is_featured"
            type="checkbox"
            defaultChecked={Boolean(workshop.is_featured)}
          />
          <span>Feature this workshop</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            name="is_published"
            type="checkbox"
            defaultChecked={
              workshop.is_published !== false && workshop.is_active !== false
            }
          />
          <span>Publish this workshop</span>
        </label>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary">
            Update Workshop
          </button>

          <Link
            href="/admin/workshops"
            className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <Link
            href={`/admin/workshops/${workshop.id}/delete`}
            className="rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 hover:bg-red-50"
          >
            Delete
          </Link>
        </div>
      </form>
    </main>
  );
}