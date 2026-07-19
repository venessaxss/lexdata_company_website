import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireProfile, normalizeRole } from "@/lib/auth";
import { markMessageReadAction, replyToMessageAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 8;

type SearchParams = {
  page?: string;
  message?: string;
  unread?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function pageHref(page: number, unread?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (unread === "1") params.set("unread", "1");
  return `/dashboard/messages?${params.toString()}`;
}

export default async function DashboardMessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  noStore();
  const params = await searchParams;
  const auth = await requireProfile("/dashboard/messages");
  const role = normalizeRole(String(auth.role));
  const canSendMessages = ["admin", "manager", "speaker"].includes(role);
  const page = Math.max(1, Number(params.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = auth.admin
    .from("user_messages")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.unread === "1") {
    query = query.eq("is_read", false);
  }

  const { data, error, count } = await query;
  const messages = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const backHref = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/dashboard";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <Link href={backHref} className="text-sm font-bold text-blue-200">
            -&gt; Back to dashboard
          </Link>
          <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">Message center</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Inbox, replies, and dashboard notices</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Read registration updates, reply to admins or managers, and send announcements from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/messages" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950">All</Link>
              <Link href="/dashboard/messages?unread=1" className="rounded-xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-800">Unread</Link>
              {canSendMessages ? (
                <Link href="/dashboard/messages/send" className="rounded-xl bg-[#8b93f8] px-4 py-3 text-sm font-black text-slate-950">Send message</Link>
              ) : null}
            </div>
          </div>
        </div>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
            {params.message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error.message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5">
          {messages.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">No messages found</h2>
              <p className="mt-2 text-slate-600">Registration messages, admin replies, and learning notices will appear here.</p>
            </div>
          ) : null}

          {messages.map((message: any) => (
            <article key={message.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">{message.title || "Message"}</h2>
                    {!message.is_read ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">New</span> : null}
                    {message.message_type ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{message.message_type}</span> : null}
                  </div>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {formatDate(message.created_at)} {message.sender_role ? ` / From: ${message.sender_role}` : ""}
                  </p>
                </div>

                {!message.is_read ? (
                  <form action={markMessageReadAction}>
                    <input type="hidden" name="id" value={message.id} />
                    <button className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">Mark read</button>
                  </form>
                ) : null}
              </div>

              {message.body ? <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{message.body}</p> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {message.link_url ? (
                  <a href={message.link_url} target={message.link_url.startsWith("http") ? "_blank" : "_self"} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                    Open link
                  </a>
                ) : null}
              </div>

              {message.sender_id ? (
                <form action={replyToMessageAction} className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="message_id" value={message.id} />
                  <label className="block text-sm font-black text-slate-700">Reply</label>
                  <textarea name="body" required rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Write a reply..." />
                  <button className="mt-3 rounded-xl bg-[#8b93f8] px-4 py-3 text-sm font-black text-slate-950">Send reply</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="text-sm font-bold text-slate-600">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Link href={pageHref(Math.max(1, page - 1), params.unread)} className={`rounded-xl px-4 py-2 text-sm font-black ${page <= 1 ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-950 text-white"}`}>Previous</Link>
            <Link href={pageHref(Math.min(totalPages, page + 1), params.unread)} className={`rounded-xl px-4 py-2 text-sm font-black ${page >= totalPages ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-950 text-white"}`}>Next</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
