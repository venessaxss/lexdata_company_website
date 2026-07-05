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
  if (!notice.is_published) return false;

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

export default async function NoticeSpotlight() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("NoticeSpotlight failed:", error);
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
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
            Notice Center
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Latest announcements
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Important updates, workshop notices, media releases, and platform
            announcements.
          </p>
        </div>

        <Link
          href="/notices"
          className="inline-flex rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          View all notices
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {notices.map((notice) => {
          const href = notice.button_href || "/notices";

          return (
            <article
              key={notice.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              {notice.media_url && notice.media_type === "image" ? (
                <img
                  src={notice.media_url}
                  alt={notice.title}
                  className="h-44 w-full object-cover"
                />
              ) : null}

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

                <h3 className="mt-4 text-xl font-black leading-tight text-slate-950">
                  {notice.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {notice.summary || notice.body || "Read the latest notice."}
                </p>

                <Link
                  href={href}
                  className="mt-5 inline-flex text-sm font-black text-blue-700 hover:text-blue-900"
                >
                  {notice.button_text || "Read more"} →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}