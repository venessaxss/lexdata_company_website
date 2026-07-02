import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Notice = {
  id: string;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  notice_type?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  button_text?: string | null;
  button_href?: string | null;
  priority?: number | null;
  created_at?: string | null;
};

function getYouTubeEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }

      if (parsed.pathname.includes("/embed/")) {
        return url;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function NoticeMedia({ notice }: { notice: Notice }) {
  const mediaType = notice.media_type || "none";
  const mediaUrl = notice.media_url;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  if (!mediaUrl || mediaType === "none") {
    return null;
  }

  if (mediaType === "image") {
    return (
      <img
        src={mediaUrl}
        alt={notice.title || "Notice image"}
        className="h-72 w-full rounded-3xl object-cover"
      />
    );
  }

  if (mediaType === "audio") {
    return (
      <div className="rounded-3xl bg-white/10 p-5">
        <audio src={mediaUrl} controls className="w-full" />
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        controls
        className="h-72 w-full rounded-3xl bg-black object-cover"
      />
    );
  }

  if (youtubeEmbedUrl) {
    return (
      <div className="overflow-hidden rounded-3xl bg-black">
        <iframe
          src={youtubeEmbedUrl}
          title={notice.title || "Notice video"}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
    >
      Open media
    </a>
  );
}

export default async function NoticeSpotlight() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notices")
    .select(
      "id, title, summary, body, notice_type, media_type, media_url, button_text, button_href, priority, created_at"
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .lte("publish_at", new Date().toISOString())
    .or(`expire_at.is.null,expire_at.gte.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const notices = (data ?? []) as Notice[];

  if (notices.length === 0) {
    return null;
  }

  const mainNotice = notices[0];
  const sideNotices = notices.slice(1);

  return (
    <section className="bg-slate-950 py-14 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
              Latest Notice
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Notice Spotlight
            </h2>

            <p className="mt-3 max-w-2xl text-slate-300">
              Important LexData updates, workshop announcements, media releases,
              and public notices.
            </p>
          </div>

          <Link
            href="/notices"
            className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            View all notices
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl">
            <div className="grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-center">
              <div>
                <span className="rounded-full bg-blue-500 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                  {mainNotice.notice_type || "Announcement"}
                </span>

                <h3 className="mt-5 text-3xl font-black leading-tight">
                  {mainNotice.title}
                </h3>

                {mainNotice.summary ? (
                  <p className="mt-4 leading-7 text-slate-200">
                    {mainNotice.summary}
                  </p>
                ) : null}

                {mainNotice.body ? (
                  <p className="mt-4 line-clamp-4 leading-7 text-slate-300">
                    {mainNotice.body}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  {mainNotice.button_href ? (
                    <a
                      href={mainNotice.button_href}
                      className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
                    >
                      {mainNotice.button_text || "Read more"}
                    </a>
                  ) : null}

                  <Link
                    href="/notices"
                    className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Notice Center
                  </Link>
                </div>
              </div>

              <NoticeMedia notice={mainNotice} />
            </div>
          </article>

          <div className="grid gap-6">
            {sideNotices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-5"
              >
                <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                  {notice.notice_type || "Notice"}
                </span>

                <h3 className="mt-3 text-xl font-black">{notice.title}</h3>

                {notice.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                    {notice.summary}
                  </p>
                ) : null}

                {notice.button_href ? (
                  <a
                    href={notice.button_href}
                    className="mt-4 inline-flex text-sm font-bold text-blue-300 hover:text-blue-200"
                  >
                    {notice.button_text || "Read more"} →
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}