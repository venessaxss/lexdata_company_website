import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";
import { createNotice, deleteNotice, updateNotice } from "./actions";

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
  audience?: string | null;
  priority?: number | null;
  is_published?: boolean | null;
  is_featured?: boolean | null;
  publish_at?: string | null;
  expire_at?: string | null;
  created_at?: string | null;
};

async function requireNoticePublisher() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, can_publish_notices")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role);

  const canPublish =
    role === "admin" ||
    role === "manager" ||
    (role === "staff" && profile?.can_publish_notices === true);

  if (!canPublish) {
    redirect("/unauthorized");
  }

  return role;
}

function formatDateForInput(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default async function NoticeManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  const role = await requireNoticePublisher();
  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const notices = (data ?? []) as Notice[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link prefetch={false}
          href={role === "admin" ? "/admin" : "/manager"}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          -&gt;Back to dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Notice Center
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Notice Release Management
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Publish homepage notices, announcements, text updates, images, audio,
          videos, external links, and public files.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Create new notice
        </h2>

        <form action={createNotice} className="mt-6 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              required
              placeholder="Notice title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="summary"
              placeholder="Short summary"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <textarea
            name="body"
            rows={5}
            placeholder="Full notice text"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-3">
            <select
              name="notice_type"
              defaultValue="announcement"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="announcement">Announcement</option>
              <option value="workshop">Workshop notice</option>
              <option value="course">Course notice</option>
              <option value="event">Event notice</option>
              <option value="urgent">Urgent notice</option>
              <option value="news">News</option>
            </select>

            <select
              name="media_type"
              defaultValue="none"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="none">No media</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="video">Video file</option>
              <option value="external_video">External video</option>
              <option value="file">File / document</option>
              <option value="link">External link</option>
            </select>

            <input
              name="priority"
              type="number"
              defaultValue={0}
              placeholder="Priority"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="media_url"
            placeholder="Media URL: image, audio, video, file, YouTube, Jianying, etc."
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="button_text"
              defaultValue="Read more"
              placeholder="Button text"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="button_href"
              placeholder="/workshops or https://..."
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Publish at
              </label>
              <input
                name="publish_at"
                type="datetime-local"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expire at
              </label>
              <input
                name="expire_at"
                type="datetime-local"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input name="is_published" type="checkbox" defaultChecked />
              Published
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input name="is_featured" type="checkbox" defaultChecked />
              Featured on homepage
            </label>
          </div>

          <button
            type="submit"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Publish notice
          </button>
        </form>
      </section>

      <section className="space-y-6">
        {notices.map((notice) => (
          <article
            key={notice.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <form action={updateNotice} className="grid gap-5">
              <input type="hidden" name="id" value={notice.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  name="title"
                  defaultValue={notice.title || ""}
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="summary"
                  defaultValue={notice.summary || ""}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <textarea
                name="body"
                rows={4}
                defaultValue={notice.body || ""}
                className="w-full rounded-xl border px-4 py-3"
              />

              <div className="grid gap-5 md:grid-cols-3">
                <select
                  name="notice_type"
                  defaultValue={notice.notice_type || "announcement"}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="announcement">Announcement</option>
                  <option value="workshop">Workshop notice</option>
                  <option value="course">Course notice</option>
                  <option value="event">Event notice</option>
                  <option value="urgent">Urgent notice</option>
                  <option value="news">News</option>
                </select>

                <select
                  name="media_type"
                  defaultValue={notice.media_type || "none"}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="none">No media</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video file</option>
                  <option value="external_video">External video</option>
                  <option value="file">File / document</option>
                  <option value="link">External link</option>
                </select>

                <input
                  name="priority"
                  type="number"
                  defaultValue={notice.priority ?? 0}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <input
                name="media_url"
                defaultValue={notice.media_url || ""}
                className="w-full rounded-xl border px-4 py-3"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  name="button_text"
                  defaultValue={notice.button_text || "Read more"}
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="button_href"
                  defaultValue={notice.button_href || ""}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  name="publish_at"
                  type="datetime-local"
                  defaultValue={formatDateForInput(notice.publish_at)}
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="expire_at"
                  type="datetime-local"
                  defaultValue={formatDateForInput(notice.expire_at)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    name="is_published"
                    type="checkbox"
                    defaultChecked={Boolean(notice.is_published)}
                  />
                  Published
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    name="is_featured"
                    type="checkbox"
                    defaultChecked={Boolean(notice.is_featured)}
                  />
                  Featured on homepage
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Save notice
                </button>

                <button
                  formAction={deleteNotice}
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}