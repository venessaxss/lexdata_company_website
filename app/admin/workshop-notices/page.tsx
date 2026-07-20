import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  deleteWorkshopNoticeAction,
  saveWorkshopNoticeAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  message?: string;
  error?: string;
};

type NoticeRow = {
  id: string;
  title: string;
  summary: string | null;
  date_label: string | null;
  venue: string | null;
  poster_url: string | null;
  href: string | null;
  badge: string | null;
  sort_order: number | null;
  is_published: boolean | null;
};

function NoticeFields({
  notice,
}: {
  notice?: Partial<NoticeRow>;
}) {
  return (
    <>
      {notice?.id ? <input type="hidden" name="id" value={notice.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Title
          <input
            name="title"
            required
            defaultValue={notice?.title || ""}
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Badge
          <input
            name="badge"
            defaultValue={notice?.badge || "WORKSHOP"}
            placeholder="NEW WORKSHOP"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Date label
          <input
            name="date_label"
            defaultValue={notice?.date_label || ""}
            placeholder="July 28, 2026"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Venue
          <input
            name="venue"
            defaultValue={notice?.venue || ""}
            placeholder="Online / Shanghai / LexData"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
          Registration or details link
          <input
            name="href"
            defaultValue={notice?.href || ""}
            placeholder="/workshops/example or https://..."
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Display order
          <input
            name="sort_order"
            type="number"
            defaultValue={notice?.sort_order ?? 0}
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Poster image
          <input
            name="poster"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="rounded-xl border border-dashed border-slate-400 bg-slate-50 px-4 py-3 font-normal"
          />
          <span className="text-xs font-normal text-slate-500">
            JPG, PNG, or WEBP. Maximum 10 MB. Leave empty to keep the current poster.
          </span>
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        Summary
        <textarea
          name="summary"
          rows={4}
          defaultValue={notice?.summary || ""}
          className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={notice?.is_published ?? true}
          className="h-5 w-5"
        />
        Show this poster on the homepage
      </label>
    </>
  );
}

export default async function WorkshopNoticeAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;

  const { data, error } = await admin
    .from("workshop_notices")
    .select(
      "id, title, summary, date_label, venue, poster_url, href, badge, sort_order, is_published"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const notices = (data || []) as NoticeRow[];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
              Admin control panel
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Workshop posters
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Upload, edit, publish, reorder, and remove the workshop posters
              shown in the homepage slider.
            </p>
          </div>

          <Link
            href="/admin"
            prefetch={false}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
            {params.message}
          </div>
        ) : null}

        {params.error || error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {params.error || error?.message}
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Add new
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Create a homepage workshop poster
          </h2>

          <form action={saveWorkshopNoticeAction} className="mt-6">
            <NoticeFields />
            <button
              type="submit"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-black text-white"
            >
              Create poster
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[320px_1fr]"
            >
              <div className="relative min-h-[360px] bg-slate-200">
                {notice.poster_url ? (
                  <Image
                    src={notice.poster_url}
                    alt={`${notice.title} poster`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full min-h-[360px] place-items-center p-8 text-center text-slate-500">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">
                        No poster uploaded
                      </p>
                      <p className="mt-3 font-serif text-3xl text-slate-800">
                        {notice.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <form action={saveWorkshopNoticeAction}>
                  <NoticeFields notice={notice} />

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
                    >
                      Save changes
                    </button>
                  </div>
                </form>

                <form action={deleteWorkshopNoticeAction} className="mt-3">
                  <input type="hidden" name="id" value={notice.id} />
                  <button
                    type="submit"
                    className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
                  >
                    Delete poster
                  </button>
                </form>
              </div>
            </article>
          ))}

          {!error && notices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
              No workshop posters yet. Create the first one above.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}