import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendRoleMessage } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireMessageSender() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard%2Fmessages%2Fsend");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager", "speaker"].includes(profile.role)) {
    redirect("/dashboard/messages");
  }

  return profile;
}

export default async function SendMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  const profile = await requireMessageSender();
  const { message } = await searchParams;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard/messages"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          -&gt;Back to message box
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Message Sender
        </p>

        <h1 className="mt-3 text-4xl font-black text-slate-950">
          Send message to users
        </h1>

        <p className="mt-3 text-slate-600">
          Admins, managers, and speakers can send messages to all users or to a
          selected role group.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Current role: {profile.role}
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <form
        action={sendRoleMessage}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Send to
            </label>
            <select
              name="target_role"
              defaultValue="all"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="all">All roles</option>
              <option value="member">Members</option>
              <option value="speaker">Speakers</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
              <option value="staff">Staff / Board / Company Members</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Message title
            </label>
            <input
              name="title"
              required
              placeholder="Workshop update"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Message body
            </label>
            <textarea
              name="body"
              required
              rows={8}
              placeholder="Write the message here..."
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Optional link
            </label>
            <input
              name="link_url"
              placeholder="/workshops or https://..."
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

         <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
  <input
    name="send_email"
    type="checkbox"
    defaultChecked
    className="h-4 w-4"
  />
  Also send this message to recipients by email
</label>

          <button type="submit" className="btn-primary w-fit">
            Send Message
          </button>
        </div>
      </form>
    </main>
  );
}