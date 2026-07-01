import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshopSubsession } from "@/app/admin/workshops/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Subsession = {
  id: string;
  session_id?: string | null;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  workshop_sessions?: {
    title?: string | null;
    workshops?: {
      title?: string | null;
      slug?: string | null;
    } | null;
  } | null;
};

export default async function EditSubsessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { id } = await params;
  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_subsessions")
    .select(
      `
      *,
      workshop_sessions:session_id (
        title,
        workshops:workshop_id (
          title,
          slug
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const subsession = data as Subsession;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin/workshops"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Edit Subsession
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {subsession.title || "Subsession"}
        </h1>

        <p className="mt-3 text-slate-600">
          Parent session: {subsession.workshop_sessions?.title || "Unknown"}
        </p>

        <p className="mt-1 text-slate-600">
          Workshop:{" "}
          {subsession.workshop_sessions?.workshops?.title || "Unknown workshop"}
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <form
        action={updateWorkshopSubsession}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={subsession.id} />

        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Subsession title
            </label>
            <input
              name="title"
              defaultValue={subsession.title ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={subsession.description ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start time
              </label>
              <input
                name="start_time"
                type="time"
                defaultValue={subsession.start_time ?? ""}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End time
              </label>
              <input
                name="end_time"
                type="time"
                defaultValue={subsession.end_time ?? ""}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Display order
              </label>
              <input
                name="display_order"
                type="number"
                defaultValue={subsession.display_order ?? 0}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Meeting URL
            </label>
            <input
              name="meeting_url"
              defaultValue={subsession.meeting_url ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Recording URL
            </label>
            <input
              name="recording_url"
              defaultValue={subsession.recording_url ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Material URL
            </label>
            <input
              name="material_url"
              defaultValue={subsession.material_url ?? ""}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Media type
              </label>
              <select
                name="media_type"
                defaultValue={subsession.media_type ?? "none"}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="none">None</option>
                <option value="image">Image</option>
                <option value="video">Direct video</option>
                <option value="external_video">YouTube / external video</option>
                <option value="external">External media</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Display status
              </label>
              <label className="flex h-[50px] items-center gap-2 rounded-xl border px-4">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={subsession.is_active !== false}
                />
                <span>Show this subsession</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Media URL
            </label>
            <input
              name="media_url"
              defaultValue={subsession.media_url ?? ""}
              placeholder="Image URL, uploaded video URL, or external media URL"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              YouTube / Jianying / external video link
            </label>
            <input
              name="external_video_url"
              defaultValue={
                subsession.media_type === "external_video"
                  ? subsession.media_url ?? ""
                  : ""
              }
              placeholder="Paste YouTube, Jianying, or external video link"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p className="mt-2 text-xs text-slate-500">
              This will override Media URL if filled.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-3">
            <button type="submit" className="btn-primary">
              Update Subsession
            </button>

            <Link
              href="/admin/workshops"
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}