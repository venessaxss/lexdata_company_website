import Link from "next/link";

type Highlight = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  session_date: string | null;
  image_url: string | null;
  video_url: string | null;
  location: string | null;
  stat_label: string | null;
  stat_value: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

export default function SessionHighlights({
  highlights,
}: {
  highlights: Highlight[];
}) {
  if (!highlights.length) return null;

  const main = highlights[0];
  const others = highlights.slice(1, 4);

  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-semibold text-blue-300">Previous Sessions</p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Highlights from LexData learning events
            </h2>

            <p className="mt-4 max-w-2xl text-slate-300">
              Showcase workshops, training moments, student activities,
              previous sessions, and research events in a dynamic homepage area.
            </p>
          </div>

          <Link
            href="/workshops"
            className="w-fit rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
          >
            View Workshops
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-3xl lg:col-span-3">
            <div className="h-[420px] bg-slate-800">
              {main.video_url ? (
                <video
                  src={main.video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : main.image_url ? (
                <img
                  src={main.image_url}
                  alt={main.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-900 to-slate-950">
                  LexData
                </div>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

            <div className="absolute bottom-0 p-8">
              {main.subtitle && (
                <p className="mb-3 inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 ring-1 ring-blue-300/30">
                  {main.subtitle}
                </p>
              )}

              <h3 className="text-3xl font-bold">{main.title}</h3>

              {main.description && (
                <p className="mt-3 max-w-2xl text-slate-200">
                  {main.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {main.location && (
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                    {main.location}
                  </span>
                )}

                {main.session_date && (
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                    {main.session_date}
                  </span>
                )}

                {main.stat_value && (
                  <span className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold">
                    {main.stat_value} {main.stat_label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:col-span-2">
            {others.map((item) => (
              <Link
                key={item.id}
                href={item.cta_href || "/workshops"}
                className="group grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/10 transition hover:bg-white/15"
              >
                <div className="h-36 bg-slate-800">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm">
                      LexData
                    </div>
                  )}
                </div>

                <div className="col-span-2 p-5">
                  <p className="text-xs font-semibold text-blue-300">
                    {item.subtitle || "Session Highlight"}
                  </p>

                  <h3 className="mt-2 font-bold leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}

            {highlights.length === 1 && (
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-blue-300">Add more highlights</p>
                <p className="mt-2 text-sm text-slate-300">
                  Use the admin panel to add more previous sessions, images, and
                  videos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}