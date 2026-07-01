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
  created_at?: string | null;
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

  const { data } = await supabase
    .from("user_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as UserMessage[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-4 text-4xl font-black text-slate-950">
          Message Box
        </h1>

        <p className="mt-3 text-slate-600">
          Payment links, workshop updates, and next steps will appear here.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">No messages yet</h2>
          <p className="mt-2 text-slate-600">
            Workshop payment links and updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    {message.title}
                  </h2>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {formatDate(message.created_at)}
                  </p>
                </div>

                {!message.is_read ? (
                  <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    New
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