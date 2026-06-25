import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createTeamMember, deleteTeamMember } from "./actions";

export default async function AdminTeamMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold text-slate-950">
          Team Members
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Add leadership, advisors, trainers, coordinators, and team pictures
          for the homepage and team page.
        </p>

        {params.message && (
          <div className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-700">
            {params.message}
          </div>
        )}

        <form
          action={createTeamMember}
          className="mt-8 grid gap-4 rounded-3xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">Add Team Member</h2>

          <input
            name="name"
            placeholder="Full name"
            required
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="role"
            placeholder="Role"
            required
            className="rounded-xl border px-4 py-3"
          />

          <select
            name="group_name"
            className="rounded-xl border px-4 py-3"
            defaultValue="Core Team"
          >
            <option value="Executive Leadership">Executive Leadership</option>
            <option value="Advisory Board">Advisory Board</option>
            <option value="Core Team">Core Team</option>
            <option value="Trainer">Trainer</option>
          </select>

          <input
            name="affiliation"
            placeholder="Affiliation, optional"
            className="rounded-xl border px-4 py-3"
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                     Upload Team Photo
            </label>

            <input
                name="image_file"
                type="file"
                accept="image/*"
                className="rounded-xl border px-4 py-3"
            />
          </div>

          <textarea
            name="bio"
            placeholder="Short bio"
            rows={4}
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="sort_order"
            type="number"
            defaultValue={1}
            className="rounded-xl border px-4 py-3"
          />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input name="is_featured" type="checkbox" defaultChecked />
              Show on homepage
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input name="is_active" type="checkbox" defaultChecked />
              Active
            </label>
          </div>

          <button className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Save Team Member
          </button>
        </form>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {members?.map((member) => (
            <div
              key={member.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
            >
              <div className="h-64 bg-slate-200">
                {member.image_url ? (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-950 text-3xl font-bold text-white">
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {member.group_name}
                </p>

                <h3 className="mt-2 text-xl font-bold">{member.name}</h3>

                <p className="mt-1 font-semibold text-slate-700">
                  {member.role}
                </p>

                {member.affiliation && (
                  <p className="mt-1 text-sm text-slate-500">
                    {member.affiliation}
                  </p>
                )}

                <form action={deleteTeamMember} className="mt-4">
                  <input type="hidden" name="id" value={member.id} />

                  <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}