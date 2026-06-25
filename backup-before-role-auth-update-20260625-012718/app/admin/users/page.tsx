import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold text-blue-700">LexData Admin</p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            User Management
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Manage students, instructors, and administrators for the LexData
            learning platform.
          </p>
        </div>

        {params.message && (
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-blue-700">
            {params.message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error.message}
          </div>
        )}

        {!users?.length && (
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              No users found
            </h2>

            <p className="mt-3 text-slate-600">
              Log in once with your email, then run the Supabase user sync SQL.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Current Role</th>
                <th className="px-5 py-4">Change Role</th>
              </tr>
            </thead>

            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-950">
                      {user.full_name || "Unnamed user"}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {user.id}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {user.email || "No email saved"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <form action={updateUserRole} className="flex gap-2">
                      <input type="hidden" name="id" value={user.id} />

                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-xl border px-3 py-2"
                      >
                        <option value="student">student</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>

                      <button className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}