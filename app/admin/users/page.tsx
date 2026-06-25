import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { APP_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, normalizeRole } from "@/lib/roles";
import { updateUserRole } from "./actions";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,role,created_at,role_changed_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="badge w-fit">Admin</p>
          <h1 className="mt-4 text-3xl font-bold">Users and roles</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Assign who is a student, speaker, manager, or admin. This controls which dashboard and management pages they can open.
          </p>
        </div>
        <Link href="/dashboard" className="btn-light w-fit">Back to dashboard</Link>
      </div>

      {params?.message ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {params.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {APP_ROLES.map((role) => (
          <div key={role} className="card p-5">
            <h2 className="font-semibold">{ROLE_LABELS[role]}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Current role</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-3">Change role</div>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-700">{error.message}</div>
        ) : null}

        {(profiles ?? []).map((profile: any) => {
          const role = normalizeRole(profile.role);
          return (
            <div key={profile.id} className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0">
              <div className="col-span-4">
                <p className="font-semibold">{profile.full_name ?? "Unnamed user"}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{profile.id}</p>
              </div>
              <div className="col-span-2">
                <span className="badge">{ROLE_LABELS[role]}</span>
              </div>
              <div className="col-span-3 text-slate-600">
                {profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"}
              </div>
              <div className="col-span-3">
                <form action={updateUserRole} className="flex gap-2">
                  <input type="hidden" name="id" value={profile.id} />
                  <select name="role" defaultValue={role === "instructor" ? "speaker" : role} className="input">
                    {APP_ROLES.map((option) => (
                      <option key={option} value={option}>{ROLE_LABELS[option]}</option>
                    ))}
                  </select>
                  <button className="btn-primary" type="submit">Save</button>
                </form>
              </div>
            </div>
          );
        })}

        {(!profiles || profiles.length === 0) ? (
          <div className="p-6 text-sm text-slate-600">No users found yet.</div>
        ) : null}
      </div>
    </section>
  );
}
