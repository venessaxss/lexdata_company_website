import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UserMessage = {
  id: string;
  title?: string | null;
  body?: string | null;
  link_url?: string | null;
  is_read?: boolean | null;
  sender_id?: string | null;
  sender_role?: string | null;
  target_role?: string | null;
  message_type?: string | null;
  created_at?: string | null;
};

type Profile = {
  role?: string | null;
  full_name?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function DashboardMessagesPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const role = profile?.role ?? "student";

  const canSendMessages =
    role === "admin" || role === "manager" || role === "speaker";

  const backHref =
    role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/dashboard";

  const { data, error } = await supabase
    .from("user_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as UserMessage[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <Link
          href={backHref}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-950">
              Message Box
            </h1>

            <p className="mt-3 text-slate-600">
              Payment links, workshop updates, learning notices, and next steps
              will appear here.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Current role: {role}
            </p>
          </div>

          {canSendMessages ? (
            <Link
              href="/dashboard/messages/send"
              className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              Send message
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            No messages yet
          </h2>

          <p className="mt-2 text-slate-600">
            Workshop payment links, registration updates, and learning notices
            will appear here.
          </p>

          {canSendMessages ? (
            <Link
              href="/dashboard/messages/send"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              Send your first message
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">
                      {message.title || "Message"}
                    </h2>

                    {!message.is_read ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        New
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {formatDate(message.created_at)}
                  </p>

                  {message.sender_role ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                      From: {message.sender_role}
                    </p>
                  ) : null}
                </div>

                {message.message_type ? (
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {message.message_type}
                  </span>
                ) : null}
              </div>

              {message.body ? (
                <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
                  {message.body}
                </p>
              ) : null}

              {message.link_url ? (
                <a
                  href={message.link_url}
                  target={
                    message.link_url.startsWith("http") ? "_blank" : "_self"
                  }
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Open link
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}