import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { normalizeRole, requireProfile } from "@/lib/auth";
import {
  deleteMessageAction,
  replyToMessageAction,
  setMessageReadStateAction,
} from "./actions";
import MessageBulkToolbar from "@/components/messages/MessageBulkToolbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 8;

type SearchParams = {
  page?: string;
  message?: string;
  status?: string;
  unread?: string;
};

type SenderIdentity = {
  name: string;
  email: string;
  role: string;
  id: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizedStatus(params: SearchParams) {
  if (params.status === "read") return "read";
  if (params.status === "unread") return "unread";
  if (params.unread === "1") return "unread";
  return "all";
}

function pageHref(page: number, status: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (status !== "all") {
    params.set("status", status);
  }

  return `/dashboard/messages?${params.toString()}`;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const value = parts
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return value || "?";
}

function senderIdentity(
  message: any,
  profile: any,
  authUser: any
): SenderIdentity {
  const metadata =
    authUser?.user_metadata &&
    typeof authUser.user_metadata === "object"
      ? authUser.user_metadata
      : {};

  const id = String(message.sender_id || "");

  const name = String(
    profile?.full_name ||
      profile?.display_name ||
      profile?.name ||
      metadata.full_name ||
      metadata.display_name ||
      metadata.name ||
      authUser?.email ||
      (id ? `User ${id.slice(0, 8)}` : "LexData system")
  );

  const email = String(profile?.email || authUser?.email || "");
  const role = String(profile?.role || message.sender_role || "system");

  return { name, email, role, id };
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
  const status = normalizedStatus(params);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let messageQuery = auth.admin
    .from("user_messages")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status === "unread") {
    messageQuery = messageQuery.eq("is_read", false);
  }

  if (status === "read") {
    messageQuery = messageQuery.eq("is_read", true);
  }

  const [messageResult, totalResult, unreadResult] = await Promise.all([
    messageQuery,
    auth.admin
      .from("user_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id),
    auth.admin
      .from("user_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("is_read", false),
  ]);

  const messages = messageResult.data || [];
  const filteredCount = messageResult.count || 0;
  const totalCount = totalResult.count || 0;
  const unreadCount = unreadResult.count || 0;
  const readCount = Math.max(0, totalCount - unreadCount);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const senderIds = Array.from(
    new Set(
      messages
        .map((message: any) => String(message.sender_id || ""))
        .filter(Boolean)
    )
  );

  let senderProfiles: any[] = [];

  if (senderIds.length > 0) {
    const result = await auth.admin
      .from("profiles")
      .select("*")
      .in("id", senderIds);

    senderProfiles = result.data || [];
  }

  const profilesById = new Map(
    senderProfiles.map((profile: any) => [
      String(profile.id || ""),
      profile,
    ])
  );

  const authUsersById = new Map<string, any>();

  await Promise.all(
    senderIds.map(async (senderId) => {
      try {
        const result = await auth.admin.auth.admin.getUserById(senderId);

        if (result.data.user) {
          authUsersById.set(senderId, result.data.user);
        }
      } catch {
        // Profile information and sender ID remain available.
      }
    })
  );

  const backHref =
    role === "admin"
      ? "/admin"
      : role === "manager"
        ? "/manager"
        : "/dashboard";

  const returnTo = pageHref(page, status);

  return (
    <main
      className="min-h-screen bg-[#f6f8fb] px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "112px" }}
    >
      <section className="mx-auto max-w-[1320px] space-y-5">
        <div className="rounded-[28px] bg-slate-950 p-7 text-white shadow-xl sm:p-8">
          <Link
            prefetch={false}
            href={backHref}
            className="text-sm font-bold text-blue-200"
          >
            &larr; Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                Message management
              </p>

              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Inbox and participant messages
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Identify senders, select multiple messages, update read
                status, delete messages, and reply from one workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                prefetch={false}
                href="/dashboard/messages"
                className={`rounded-xl px-4 py-3 text-sm font-black ${
                  status === "all"
                    ? "bg-white text-slate-950"
                    : "bg-slate-800 text-white"
                }`}
              >
                All {totalCount}
              </Link>

              <Link
                prefetch={false}
                href="/dashboard/messages?status=unread"
                className={`rounded-xl px-4 py-3 text-sm font-black ${
                  status === "unread"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-800 text-white"
                }`}
              >
                Unread {unreadCount}
              </Link>

              <Link
                prefetch={false}
                href="/dashboard/messages?status=read"
                className={`rounded-xl px-4 py-3 text-sm font-black ${
                  status === "read"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-800 text-white"
                }`}
              >
                Read {readCount}
              </Link>

              {canSendMessages ? (
                <Link
                  prefetch={false}
                  href="/dashboard/messages/send"
                  className="rounded-xl bg-[#8b93f8] px-4 py-3 text-sm font-black text-slate-950"
                >
                  Send message
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {params.message ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
            {params.message}
          </div>
        ) : null}

        {messageResult.error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {messageResult.error.message}
          </div>
        ) : null}

        <MessageBulkToolbar
          returnTo={returnTo}
          visibleCount={messages.length}
        />

        <div className="grid gap-4">
          {messages.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                No messages found
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Messages matching this filter will appear here.
              </p>
            </div>
          ) : null}

          {messages.map((message: any) => {
            const senderId = String(message.sender_id || "");
            const identity = senderIdentity(
              message,
              profilesById.get(senderId),
              authUsersById.get(senderId)
            );

            return (
              <article
                key={message.id}
                className={`overflow-hidden rounded-[24px] border bg-white shadow-sm ${
                  message.is_read
                    ? "border-slate-200"
                    : "border-blue-200 ring-1 ring-blue-100"
                }`}
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/80 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <input
                      type="checkbox"
                      name="message_ids"
                      value={message.id}
                      form="bulk-message-form"
                      data-message-checkbox="true"
                      aria-label={`Select message from ${identity.name}`}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                    />

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                      {initials(identity.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black leading-tight text-slate-950">
                          {message.title || "Message"}
                        </h2>

                        {!message.is_read ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            New
                          </span>
                        ) : null}

                        {message.message_type ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {message.message_type}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-black text-slate-900">
                          From: {identity.name}
                        </span>

                        {identity.email ? (
                          <span className="text-slate-600">
                            {identity.email}
                          </span>
                        ) : null}

                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black uppercase text-indigo-700">
                          {identity.role}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        {formatDate(message.created_at)}
                      </p>

                      {identity.id ? (
                        <details className="mt-2 text-xs text-slate-500">
                          <summary className="cursor-pointer font-bold">
                            Sender account ID
                          </summary>
                          <p className="mt-1 break-all font-mono">
                            {identity.id}
                          </p>
                        </details>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <form action={setMessageReadStateAction}>
                      <input type="hidden" name="id" value={message.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <input
                        type="hidden"
                        name="is_read"
                        value={message.is_read ? "false" : "true"}
                      />
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100">
                        {message.is_read ? "Mark unread" : "Mark read"}
                      </button>
                    </form>

                    <form action={deleteMessageAction}>
                      <input type="hidden" name="id" value={message.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                <div className="p-5">
                  {message.body ? (
                    <p className="whitespace-pre-wrap leading-7 text-slate-700">
                      {message.body}
                    </p>
                  ) : null}

                  {message.link_url ? (
                    <div className="mt-5">
                      <a
                        href={message.link_url}
                        target={
                          message.link_url.startsWith("http")
                            ? "_blank"
                            : "_self"
                        }
                        rel={
                          message.link_url.startsWith("http")
                            ? "noreferrer"
                            : undefined
                        }
                        className="inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                      >
                        Open link
                      </a>
                    </div>
                  ) : null}

                  {message.sender_id ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer px-5 py-4 text-sm font-black text-slate-800">
                        Reply to {identity.name}
                      </summary>

                      <form
                        action={replyToMessageAction}
                        className="border-t border-slate-200 p-4"
                      >
                        <input
                          type="hidden"
                          name="message_id"
                          value={message.id}
                        />
                        <input
                          type="hidden"
                          name="return_to"
                          value={returnTo}
                        />
                        <textarea
                          name="body"
                          required
                          rows={3}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3"
                          placeholder="Write a reply..."
                        />
                        <button className="mt-3 rounded-xl bg-[#8b93f8] px-4 py-3 text-sm font-black text-slate-950">
                          Send reply
                        </button>
                      </form>
                    </details>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-bold text-slate-600">
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <Link
              prefetch={false}
              href={pageHref(Math.max(1, page - 1), status)}
              className={`rounded-xl px-4 py-2 text-sm font-black ${
                page <= 1
                  ? "pointer-events-none bg-slate-100 text-slate-400"
                  : "bg-slate-950 text-white"
              }`}
            >
              Previous
            </Link>

            <Link
              prefetch={false}
              href={pageHref(Math.min(totalPages, page + 1), status)}
              className={`rounded-xl px-4 py-2 text-sm font-black ${
                page >= totalPages
                  ? "pointer-events-none bg-slate-100 text-slate-400"
                  : "bg-slate-950 text-white"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
