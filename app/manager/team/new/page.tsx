import { createTeamMember } from "@/app/admin/team/actions";

export default async function NewManagerTeamMemberPage({
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

      <form
        action={createTeamMember}
        encType="multipart/form-data"
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="return_to" value="/manager/team" />

        <input
          name="full_name"
          placeholder="Full name"
          required
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="position_title"
          placeholder="Role title, e.g. Founder and CEO"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="section"
          placeholder="Section, e.g. Executive Leadership"
          defaultValue="Core Team"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="institution"
          placeholder="Institution, e.g. University of Liverpool"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="organization"
          placeholder="Organization, e.g. LexData"
          className="w-full rounded-xl border px-4 py-3"
        />

        <textarea
          name="bio"
          placeholder="Short bio"
          rows={6}
          className="w-full rounded-xl border px-4 py-3"
        />

        <select
          name="media_type"
          defaultValue="image"
          className="w-full rounded-xl border px-4 py-3"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="recommended">System recommended style</option>
        </select>

        <input
          name="media_file"
          type="file"
          accept="image/*"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="video_file"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="media_url"
          placeholder="Or paste image URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="video_url"
          placeholder="Or paste video URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <select
          name="style_preset"
          defaultValue="navy"
          className="w-full rounded-xl border px-4 py-3"
        >
          <option value="navy">Navy professional</option>
          <option value="royal">Royal blue</option>
          <option value="academic">Academic dark</option>
          <option value="purple">Purple AI style</option>
          <option value="emerald">Emerald research style</option>
          <option value="gold">Gold leadership style</option>
        </select>

        <input
          name="profile_highlight"
          placeholder="Short highlight"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="profile_cta"
          placeholder="Button text"
          defaultValue="View Profile"
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

        <label className="flex items-center gap-2">
          <input name="is_featured" type="checkbox" defaultChecked />
          <span>Show on homepage</span>
        </label>

        <button type="submit" className="btn-primary">
          Save member
        </button>
      </form>
    </main>
  );
}