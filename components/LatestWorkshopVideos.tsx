import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  session_date?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  start_date?: string | null;
  date?: string | null;
  format?: string | null;
  instructor?: string | null;
  speaker?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
};

export default async function LatestWorkshopVideos() {
  noStore();

  const supabase = await createClient();

  const { data: sessionsData, error } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("is_active", true)
    .eq("media_type", "video")
    .not("media_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("LatestWorkshopVideos error:", error.message);
    return null;
  }

  const sessions = (sessionsData ?? []) as WorkshopSession[];

  if (sessions.length === 0) {
    return null;
  }

  const workshopIds = Array.from(
    new Set(
      sessions
        .map((session) => session.workshop_id)
        .filter(Boolean) as string[]
    )
  );

  let workshopsById = new Map<string, Workshop>();

  if (workshopIds.length > 0) {
    const { data: workshopsData } = await supabase
      .from("workshops")
      .select("*")
      .in("id", workshopIds);

    workshopsById = new Map(
      ((workshopsData ?? []) as Workshop[]).map((workshop) => [
        workshop.id,
        workshop,
      ])
    );
  }

  const featuredVideos = sessions
    .map((session) => {
      const workshop = session.workshop_id
        ? workshopsById.get(session.workshop_id)
        : null;

      return {
        session,
        workshop,
      };
    })
    .filter(({ workshop }) => {
      if (!workshop) return true;

      const published =
        workshop.is_published !== false && workshop.is_active !== false;

      return published;
    })
    .slice(0, 3);

  if (featuredVideos.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              Latest Video Uploads
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Upcoming workshop introductions
            </h2>

            <p className="mt-5 max-w-2xl text-slate-300">
              Watch the newest workshop introduction videos, session previews,
              and learning highlights from LexData.
            </p>
          </div>

          <Link
            href="/workshops"
            className="inline-flex w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            View all workshops
          </Link>
        </div>

        <div className="grid gap-7 lg:grid-cols-3">
          {featuredVideos.map(({ session, workshop }, index) => {
            const workshopTitle =
              workshop?.title || session.title || "Upcoming Workshop";

            const workshopDescription =
              workshop?.short_description ||
              workshop?.summary ||
              workshop?.description ||
              "A new LexData workshop preview video is now available.";

            const href = workshop?.slug
              ? `/workshops/${workshop.slug}`
              : "/workshops";

            return (
              <article
                key={session.id}
                className={
                  index === 0
                    ? "overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur lg:col-span-2"
                    : "overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl backdrop-blur"
                }
              >
                <div className={index === 0 ? "h-[420px]" : "h-72"}>
                  <video
                    src={session.media_url ?? ""}
                    className="h-full w-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                </div>

                <div className="p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-100">
                      Video Preview
                    </span>

                    {workshop?.level ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {workshop.level}
                      </span>
                    ) : null}

                    {workshop?.format ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {workshop.format}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-2xl font-black text-white">
                    {workshopTitle}
                  </h3>

                  <p className="mt-3 line-clamp-3 leading-7 text-slate-300">
                    {workshopDescription}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    {workshop?.start_date || workshop?.date ? (
                      <span>
                        Starts: {workshop.start_date || workshop.date}
                      </span>
                    ) : null}

                    {workshop?.instructor || workshop?.speaker ? (
                      <span>
                        Instructor: {workshop.instructor || workshop.speaker}
                      </span>
                    ) : null}
                  </div>

                  <Link
                    href={href}
                    className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
                  >
                    View workshop
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}