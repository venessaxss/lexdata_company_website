import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";
import CopyField from "@/components/livestream/CopyField";
import {
  createWorkshopLivestreamAction,
  setWorkshopLivestreamEnabledAction,
  syncWorkshopLivestreamAction,
  updateWorkshopLivestreamAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  message?: string;
  error?: string;
}>;

function localDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function ManagerLivestreamsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  noStore();

  const params = searchParams ? await searchParams : {};
  const actor = await requireManagerOrAdmin("/manager/livestreams");

  const [{ data: workshops }, { data: streams }, { data: attendance }] =
    await Promise.all([
      actor.admin
        .from("workshops")
        .select("id, title, slug")
        .order("created_at", { ascending: false }),
      actor.admin
        .from("workshop_live_streams")
        .select(
          `
          *,
          workshops:workshop_id (
            id,
            title,
            slug
          )
        `
        )
        .order("created_at", { ascending: false }),
      actor.admin
        .from("live_attendance")
        .select("stream_id, user_id, last_seen_at"),
    ]);

  const configured = new Set(
    (streams || []).map((stream: any) => stream.workshop_id)
  );
  const available = (workshops || []).filter(
    (workshop: any) => !configured.has(workshop.id)
  );

  const attendanceByStream = new Map<
    string,
    { total: number; active: number }
  >();
  const activeCutoff = Date.now() - 90000;

  for (const item of attendance || []) {
    const current = attendanceByStream.get(item.stream_id) || {
      total: 0,
      active: 0,
    };

    current.total += 1;

    if (
      item.last_seen_at &&
      new Date(item.last_seen_at).getTime() >= activeCutoff
    ) {
      current.active += 1;
    }

    attendanceByStream.set(item.stream_id, current);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Registered streaming
              </p>
              <h1 className="mt-2 text-4xl font-black text-slate-950">
                Workshop Livestream Control
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Create protected Stream inputs, copy OBS credentials, monitor
                viewers, and synchronize the recording after the broadcast.
              </p>
            </div>

            <Link
              href="/manager"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black"
            >
              Back to manager
            </Link>
          </div>
        </section>

        {params.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {params.message}
          </div>
        ) : null}

        {params.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {params.error}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black">Create livestream</h2>

          {available.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              Every workshop already has a livestream.
            </p>
          ) : (
            <form
              action={createWorkshopLivestreamAction}
              className="mt-5 grid gap-4"
            >
              <input type="hidden" name="return_to" value="/manager/livestreams" />

              <select
                name="workshop_id"
                required
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              >
                <option value="">Choose workshop</option>
                {available.map((workshop: any) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.title || "Untitled workshop"}
                  </option>
                ))}
              </select>

              <input
                name="title"
                placeholder="Livestream title (optional)"
                className="rounded-2xl border border-slate-300 px-4 py-3"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="scheduled_start"
                  type="datetime-local"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="scheduled_end"
                  type="datetime-local"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="flex justify-end">
                <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                  Create protected live input
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="space-y-5">
          {(streams || []).map((stream: any) => {
            const workshop = Array.isArray(stream.workshops)
              ? stream.workshops[0]
              : stream.workshops;
            const counts = attendanceByStream.get(stream.id) || {
              total: 0,
              active: 0,
            };

            return (
              <article
                key={stream.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border bg-white px-3 py-1 text-xs font-black">
                          {stream.status}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            stream.is_enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {stream.is_enabled ? "Input enabled" : "Input disabled"}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-black">
                        {stream.title || workshop?.title || "Workshop livestream"}
                      </h2>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {workshop?.title || "Unknown workshop"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workshop?.slug ? (
                        <Link
                          href={`/workshops/${workshop.slug}/live`}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                        >
                          Open live room
                        </Link>
                      ) : null}

                      <form action={syncWorkshopLivestreamAction}>
                        <input type="hidden" name="return_to" value="/manager/livestreams" />
                        <input type="hidden" name="id" value={stream.id} />
                        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black">
                          Sync status and recording
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border bg-white p-4">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Active viewers
                      </p>
                      <p className="mt-2 text-3xl font-black">{counts.active}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Joined users
                      </p>
                      <p className="mt-2 text-3xl font-black">{counts.total}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Recording
                      </p>
                      <p className="mt-2 font-black">
                        {stream.recording_uid ? "Available" : "Not synchronized"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                      <h3 className="text-lg font-black text-amber-900">
                        OBS broadcast credentials
                      </h3>
                      <p className="mt-2 text-sm text-amber-800">
                        Keep the stream key private.
                      </p>
                      <div className="mt-5 space-y-4">
                        <CopyField label="RTMPS server" value={stream.rtmps_url || ""} />
                        <CopyField label="Stream key" value={stream.stream_key || ""} secret />
                        <CopyField label="Live input ID" value={stream.live_input_uid || ""} />
                      </div>
                    </div>

                    <form action={setWorkshopLivestreamEnabledAction}>
                      <input type="hidden" name="return_to" value="/manager/livestreams" />
                      <input type="hidden" name="id" value={stream.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={stream.is_enabled ? "false" : "true"}
                      />
                      <button
                        className={`rounded-2xl px-5 py-3 text-sm font-black ${
                          stream.is_enabled
                            ? "border border-red-200 text-red-700"
                            : "bg-emerald-700 text-white"
                        }`}
                      >
                        {stream.is_enabled ? "Disable live input" : "Enable live input"}
                      </button>
                    </form>
                  </div>

                  <form
                    action={updateWorkshopLivestreamAction}
                    className="grid gap-4 rounded-3xl border p-5"
                  >
                    <input type="hidden" name="return_to" value="/manager/livestreams" />
                    <input type="hidden" name="id" value={stream.id} />

                    <h3 className="text-lg font-black">Livestream settings</h3>

                    <input
                      name="title"
                      defaultValue={stream.title || ""}
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    />

                    <select
                      name="status"
                      defaultValue={stream.status || "scheduled"}
                      className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="waiting">Waiting</option>
                      <option value="live">Live</option>
                      <option value="ended">Ended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                      name="scheduled_start"
                      type="datetime-local"
                      defaultValue={localDateTime(stream.scheduled_start)}
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    />
                    <input
                      name="scheduled_end"
                      type="datetime-local"
                      defaultValue={localDateTime(stream.scheduled_end)}
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    />
                    <input
                      name="recording_uid"
                      defaultValue={stream.recording_uid || ""}
                      placeholder="Cloudflare recording video ID"
                      className="rounded-2xl border border-slate-300 px-4 py-3"
                    />

                    <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                      Save livestream settings
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
