import { createTeamMember } from "../actions";

export default async function NewTeamMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Add Team Member</h1>

      {message ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <form action={createTeamMember} className="mt-8 space-y-5">
        <input
          name="full_name"
          placeholder="Full name"
          required
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="role_title"
          placeholder="Role title, e.g. Research Trainer"
          className="w-full rounded-xl border px-4 py-3"
        />

        <textarea
          name="bio"
          placeholder="Short bio"
          rows={6}
          className="w-full rounded-xl border px-4 py-3"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Upload photo
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
          placeholder="Or paste image URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="display_order"
          type="number"
          placeholder="Display order"
          defaultValue={0}
          className="w-full rounded-xl border px-4 py-3"
        />

        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked />
          <span>Show on public team page</span>
        </label>

        <button type="submit" className="btn-primary">
          Save member
        </button>
      </form>
    </main>
  );
}