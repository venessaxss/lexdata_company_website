import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserRole } from "./actions";
import { normalizeRole } from "@/lib/roles";

const roles = ["member", "speaker", "manager", "staff", "admin"];
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const { message } = await searchParams;
  const supabaseAdmin = createAdminClient();

  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (usersError) {
    throw new Error(usersError.message);
  }

  const userIds = users.map((user) => user.id);

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Users and Roles
        </h1>
        <p className="mt-2 text-slate-600">
          Assign members, speakers, managers, staff, and admins from this page.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Current role</th>
              <th className="px-4 py-3">Change role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const profile = profileMap.get(user.id);
             const currentRole = normalizeRole(profile?.role);
              return (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">
                      {user.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {user.id}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {profile?.full_name ?? "-"}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {currentRole}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={user.id} />

                      <select
                        name="role"
                        defaultValue={currentRole}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}