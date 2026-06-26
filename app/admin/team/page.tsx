import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteTeamMember } from "./actions";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const { message } = await searchParams;
  const supabase = createAdminClient();

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Team Members
          </h1>
          <p className="mt-2 text-slate-600">
            Modify team photos, bios, speaker titles, and visibility.
          </p>
        </div>

        <Link href="/admin/team/new" className="btn-primary">
          Add member
        </Link>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(members ?? []).map((member) => (
              <tr key={member.id} className="border-t border-slate-100">
                <td className="px-4 py-4">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-slate-100" />
                  )}
                </td>

                <td className="px-4 py-4 font-medium text-slate-900">
                  {member.full_name}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {member.role_title || "-"}
                </td>

                <td className="px-4 py-4">
                  {member.is_active ? "Yes" : "No"}
                </td>

                <td className="px-4 py-4">{member.display_order}</td>

                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/team/${member.id}/edit`}
                      className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
                    >
                      Edit
                    </Link>

                    <form action={deleteTeamMember}>
                      <input type="hidden" name="id" value={member.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}