import { requireAdminOrManager } from "@/lib/auth";
export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { deleteTeamMember } from "@/app/admin/team/actions";
import TeamOrderManager from "@/components/TeamOrderManager";

function getName(member: any) {
  return member.full_name || member.name || "Unnamed member";
}

function getRole(member: any) {
  return (
    member.position_title ||
    member.role_title ||
    member.role ||
    member.title ||
    "Team Member"
  );
}

function getPhoto(member: any) {
  return member.media_url || member.photo_url || member.profile_image_url || "";
}

export default async function ManagerTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdminOrManager();

  const { message } = await searchParams;
  const supabase = createAdminClient();

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const orderMembers = (members ?? []).map((member: any) => ({
    id: member.id,
    name: getName(member),
    role: getRole(member),
    section: member.section,
    photo: getPhoto(member),
    is_active: member.is_active,
    is_featured: member.is_featured,
    sort_order: member.sort_order ?? member.display_order ?? 0,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-500">Manager</p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Team Members
          </h1>

          <p className="mt-2 text-slate-600">
            Modify homepage team photos, bios, titles, sections, visibility, and
            display order.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            View Homepage
          </Link>

          <Link href="/manager/team/new" className="btn-primary">
            Add member
          </Link>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <TeamOrderManager members={orderMembers} returnTo="/manager/team" />

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Homepage</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(members ?? []).map((member: any) => {
              const photo = getPhoto(member);
              const name = getName(member);
              const role = getRole(member);

              return (
                <tr key={member.id} className="border-t border-slate-100">
                  <td className="px-4 py-4">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-100" />
                    )}
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-900">
                    {name}
                  </td>

                  <td className="px-4 py-4 text-slate-600">{role || "-"}</td>

                  <td className="px-4 py-4 text-slate-600">
                    {member.section || "-"}
                  </td>

                  <td className="px-4 py-4">
                    {member.is_active ? "Yes" : "No"}
                  </td>

                  <td className="px-4 py-4">
                    {member.is_featured ? "Yes" : "No"}
                  </td>

                  <td className="px-4 py-4">
                    {member.sort_order ?? member.display_order ?? 0}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/team/${member.profile_slug || member.id}`}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-blue-700 hover:bg-blue-50"
                      >
                        View
                      </Link>

                      <Link
                        href={`/manager/team/${member.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
                      >
                        Edit
                      </Link>

                      <form action={deleteTeamMember}>
                        <input
                          type="hidden"
                          name="return_to"
                          value="/manager/team"
                        />
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
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}