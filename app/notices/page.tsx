import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default async function NoticesPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data } = await supabase
    .from("notices")
    .select("*")
    .eq("is_published", true)
    .lte("publish_at", now)
    .or(`expire_at.is.null,expire_at.gte.${now}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const notices = (data ?? []) as Notice[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to homepage
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Notice Center
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Latest Notices
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Public notices, workshop announcements, course updates, media releases,
          and important LexData information.
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            No notices yet
          </h2>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.2em]">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  {notice.notice_type || "Notice"}
                </span>

                {notice.created_at ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                    {formatDate(notice.created_at)}
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                {notice.title}
              </h2>

              {notice.summary ? (
                <p className="mt-3 text-lg leading-8 text-slate-600">
                  {notice.summary}
                </p>
              ) : null}

              {notice.body ? (
                <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">
                  {notice.body}
                </p>
              ) : null}

              {notice.media_url ? (
                <a
                  href={notice.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Open media
                </a>
              ) : null}

              {notice.button_href ? (
                <a
                  href={notice.button_href}
                  className="mt-5 ml-3 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  {notice.button_text || "Read more"}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}