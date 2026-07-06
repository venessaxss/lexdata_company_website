import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardMessagesPage() {
  noStore();

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="p-8">Please log in to view messages.</main>;
  }

  const { data: messages } = await admin
    .from("internal_messages")
    .select("*")
    .or(`user_id.eq.${user.id},recipient_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-black text-slate-950">Messages</h1>

        {(messages ?? []).map((message: any) => (
          <article
            key={message.id}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-black text-slate-950">
              {message.title}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {message.body}
            </p>
            <p className="mt-4 text-xs font-bold text-slate-400">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </article>
        ))}

        {(messages ?? []).length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-400">
            No messages yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}