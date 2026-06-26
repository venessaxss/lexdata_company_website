import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTeamMember } from "../../actions";

export default async function EditTeamMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();

  if (!member) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Edit Team Member</h1>

      {message ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <form action={updateTeamMember} className="mt-8 space-y-5">
        <input type="hidden" name="id" value={member.id} />
        <input type="hidden" name="current_photo_url" value={member.photo_url ?? ""} />

        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            className="h-48 w-48 rounded-2xl object-cover"
          />
        ) : null}

        <input
          name="full_name"
          defaultValue={member.full_name}
          required
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="role_title"
          defaultValue={member.role_title ?? ""}
          className="w-full rounded-xl border px-4 py-3"
        />

        <textarea
          name="bio"
          defaultValue={member.bio ?? ""}
          rows={6}
          className="w-full rounded-xl border px-4 py-3"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Replace photo
          </label>
          <input
            name="photo"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <input
          name="photo_url"
          defaultValue={member.photo_url ?? ""}
          placeholder="Or paste image URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="display_order"
          type="number"
          defaultValue={member.display_order ?? 0}
          className="w-full rounded-xl border px-4 py-3"
        />

        <label className="flex items-center gap-2">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={member.is_active}
          />
          <span>Show on public team page</span>
        </label>

        <button type="submit" className="btn-primary">
          Update member
        </button>
      </form>
    </main>
  );
}