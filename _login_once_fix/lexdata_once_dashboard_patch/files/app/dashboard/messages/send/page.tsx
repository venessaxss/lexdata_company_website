import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sendRoleMessage, sendDirectMessage } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SendMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  const auth = await requireRole(["admin", "manager", "speaker"], "/dashboard/messages/send");
  const { message } = await searchParams;

  const { data: recentUsers } = await auth.admin
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true })
    .limit(80);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-5xl">
        <Link href="/dashboard/messages" className="text-sm font-black text-slate-600">
          -&gt; Back to message box
        </Link>

        <div className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">Message sender</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Send or reply to participants</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Send messages to all users, role groups, or one specific registrant/user. Current role: {auth.role}
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form action={sendRoleMessage} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Broadcast message</h2>
            <div className="mt-5 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">Send to</span>
                <select name="target_role" defaultValue="all" className="w-full rounded-xl border px-4 py-3">
                  <option value="all">All roles</option>
                  <option value="member">Members</option>
                  <option value="speaker">Speakers</option>
                  <option value="manager">Managers</option>
                  <option value="admin">Admins</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
              <input name="title" required placeholder="Message title" className="w-full rounded-xl border px-4 py-3" />
              <textarea name="body" required rows={7} placeholder="Write the message here..." className="w-full rounded-xl border px-4 py-3" />
              <input name="link_url" placeholder="Optional link: /manager/registrations or https://..." className="w-full rounded-xl border px-4 py-3" />
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input name="send_email" type="checkbox" className="h-4 w-4" />
                Also send by email when available
              </label>
              <button className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Send broadcast</button>
            </div>
          </form>

          <form action={sendDirectMessage} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Direct message</h2>
            <div className="mt-5 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">Recipient</span>
                <select name="user_id" required className="w-full rounded-xl border px-4 py-3">
                  <option value="">Choose user</option>
                  {(recentUsers ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.id} / {user.role || "member"}</option>
                  ))}
                </select>
              </label>
              <input name="title" required placeholder="Message title" className="w-full rounded-xl border px-4 py-3" />
              <textarea name="body" required rows={7} placeholder="Write a direct reply..." className="w-full rounded-xl border px-4 py-3" />
              <input name="link_url" placeholder="Optional link" className="w-full rounded-xl border px-4 py-3" />
              <button className="w-fit rounded-xl bg-[#8b93f8] px-5 py-3 text-sm font-black text-slate-950">Send direct message</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
