import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type Notice = {
  id: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  notice_type?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  button_text?: string | null;
  button_href?: string | null;
  priority?: number | null;
  is_featured?: boolean | null;
  is_published?: boolean | null;
  publish_at?: string | null;
  expire_at?: string | null;
  created_at?: string | null;
};

function isVisibleNotice(notice: Notice) {
  if (!notice.is_published) {
    return false;
  }

  const now = Date.now();

  if (notice.publish_at) {
    const publishAt = new Date(notice.publish_at).getTime();

    if (!Number.isNaN(publishAt) && publishAt > now) {
      return false;
    }
  }

  if (notice.expire_at) {
    const expireAt = new Date(notice.expire_at).getTime();

    if (!Number.isNaN(expireAt) && expireAt < now) {
      return false;
    }
  }

  return true;
}

function sortNotices(a: Notice, b: Notice) {
  const featuredA = a.is_featured ? 1 : 0;
  const featuredB = b.is_featured ? 1 : 0;

  if (featuredA !== featuredB) {
    return featuredB - featuredA;
  }

  const priorityA = a.priority ?? 0;
  const priorityB = b.priority ?? 0;

  if (priorityA !== priorityB) {
    return priorityB - priorityA;
  }

  const dateA = a.publish_at || a.created_at || "";
  const dateB = b.publish_at || b.created_at || "";

  return new Date(dateB).getTime() - new Date(dateA).getTime();
}

function renderMedia(notice: Notice) {
  if (!notice.media_url) {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-slate-100 text-sm font-black text-slate-500">
        No media
      </div>
    );
  }

  if (notice.media_type === "image") {
    return (
      <img
        src={notice.media_url}
        alt={notice.title}
        className="h-72 w-full object-cover"
      />
    );
  }

  if (notice.media_type === "video") {
    return (
      <video
        src={notice.media_url}
        controls
        className="h-72 w-full bg-slate-950 object-cover"
      />
    );
  }

  if (notice.media_type === "audio") {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-slate-100 p-6">
        <audio src={notice.media_url} controls className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-72 w-full items-center justify-center bg-slate-100 p-6">
      <a
        href={notice.media_url}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
      >
        Open media
      </a>
    </div>
  );
}

export default async function HomeMediaShowcase() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("HomeMediaShowcase notices failed:", error);
    return null;
  }

  const notices = ((data ?? []) as Notice[])
    .filter(isVisibleNotice)
    .sort(sortNotices)
    .slice(0, 3);

  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-blue-700">
            LexData Media
          </p>

          <h2 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Training, research, and learning highlights
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Explore LexData training sessions, research support, public notices,
            and online learning programs.
          </p>
        </div>

        <Link
          href="/workshops"
          className="inline-flex rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-700"
        >
          Explore workshops
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notices.map((notice) => {
          const href = notice.button_href || "/notices";

          return (
            <article
              key={notice.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
            >
              {renderMedia(notice)}

              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {notice.is_featured ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      Featured
                    </span>
                  ) : null}

                  {notice.notice_type ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {notice.notice_type}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                  {notice.title}
                </h3>

                {(notice.summary || notice.body) ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {notice.summary || notice.body}
                  </p>
                ) : null}

                <Link
                  href={href}
                  className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                >
                  {notice.button_text || "Learn more"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}