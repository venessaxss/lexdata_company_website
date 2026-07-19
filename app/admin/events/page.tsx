import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLexDataEvents, formatEventDate } from "@/lib/lexdata-events";
import {
  saveLexDataEventAction,
  unpublishLexDataEventAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    redirect("/");
  }
}

function EventFields({ event }: { event?: any }) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={event?.id ?? ""} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Title</span>
          <input
            name="title"
            required
            defaultValue={event?.title ?? ""}
            placeholder="AI Research Workflow Bootcamp is open"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Slug</span>
          <input
            name="slug"
            defaultValue={event?.slug ?? ""}
            placeholder="ai-research-workflow-bootcamp"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Category</span>
          <input
            name="category"
            defaultValue={event?.category ?? "What's new"}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Author</span>
          <input
            name="author"
            defaultValue={event?.author ?? "LexData Team"}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Date</span>
          <input
            type="date"
            name="event_date"
            defaultValue={event?.event_date ?? new Date().toISOString().slice(0, 10)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Sort order</span>
          <input
            type="number"
            name="sort_order"
            defaultValue={event?.sort_order ?? 0}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-slate-700">Short excerpt</span>
        <textarea
          name="excerpt"
          rows={3}
          defaultValue={event?.excerpt ?? ""}
          placeholder="Short summary shown on the What's new page and homepage."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-slate-700">Full content</span>
        <textarea
          name="content"
          rows={7}
          defaultValue={event?.content ?? ""}
          placeholder="Full event update, workshop description, founder note, or release announcement."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Poster URL</span>
          <input
            name="poster_url"
            defaultValue={event?.poster_url ?? ""}
            placeholder="/images/poster.png or https://..."
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Image URL</span>
          <input
            name="image_url"
            defaultValue={event?.image_url ?? ""}
            placeholder="/images/event-cover.png or https://..."
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Video URL</span>
          <input
            name="video_url"
            defaultValue={event?.video_url ?? ""}
            placeholder="YouTube, Vimeo, or video URL"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">CTA label</span>
          <input
            name="cta_label"
            defaultValue={event?.cta_label ?? "Read more"}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">CTA href</span>
          <input
            name="cta_href"
            defaultValue={event?.cta_href ?? ""}
            placeholder="/workshops"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input type="checkbox" name="is_active" defaultChecked={event?.is_active ?? true} />
          Published
        </label>

        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input type="checkbox" name="is_featured" defaultChecked={event?.is_featured ?? true} />
          Feature on homepage
        </label>
      </div>
    </>
  );
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdminOrManager();

  const params = await searchParams;
  const events = await getLexDataEvents({
    activeOnly: false,
    limit: 50,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
              LexData events
            </p>

            <h1 className="mt-3 text-4xl font-black text-slate-950">
              What's new editor
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              Add workshops, posters, images, videos, release notes, founder
              updates, and homepage event cards.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/blog/whats-new"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
            >
              View page
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              View homepage
            </Link>
          </div>
        </div>

        {params.message ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
            Event {params.message}.
          </div>
        ) : null}

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Add new event
          </h2>

          <form action={saveLexDataEventAction} className="mt-5">
            <EventFields />

            <button className="mt-6 rounded-2xl bg-blue-700 px-6 py-4 text-base font-black text-white hover:bg-blue-800">
              Create event
            </button>
          </form>
        </section>

        <div className="space-y-6">
          {events.map((event) => (
            <section
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    {event.category} · {formatEventDate(event.event_date)}
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {event.title}
                  </h2>
                </div>

                <form action={unpublishLexDataEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                    Unpublish
                  </button>
                </form>
              </div>

              <form action={saveLexDataEventAction}>
                <EventFields event={event} />

                <button className="mt-6 rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white hover:bg-slate-800">
                  Save changes
                </button>
              </form>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}