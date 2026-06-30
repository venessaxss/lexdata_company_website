import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTeamMember } from "@/app/admin/team/actions";

export default async function EditManagerTeamMemberPage({
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

  const photo = member.media_url || member.photo_url || member.profile_image_url;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Edit Team Member</h1>

      {message ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <form
        action={updateTeamMember}
        encType="multipart/form-data"
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="return_to" value="/manager/team" />
        <input type="hidden" name="id" value={member.id} />

        <input
          type="hidden"
          name="current_media_url"
          value={member.media_url ?? member.photo_url ?? member.profile_image_url ?? ""}
        />

        <input
          type="hidden"
          name="current_video_url"
          value={member.video_url ?? ""}
        />

        {photo ? (
          <img
            src={photo}
            alt={member.full_name ?? member.name}
            className="h-48 w-48 rounded-2xl object-cover"
          />
        ) : null}

        <input
          name="full_name"
          defaultValue={member.full_name ?? member.name ?? ""}
          required
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="position_title"
          defaultValue={
            member.position_title ?? member.role_title ?? member.role ?? ""
          }
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="section"
          defaultValue={member.section ?? "Core Team"}
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="institution"
          defaultValue={member.institution ?? ""}
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="organization"
          defaultValue={member.organization ?? ""}
          className="w-full rounded-xl border px-4 py-3"
        />

        <textarea
          name="bio"
          defaultValue={member.bio ?? ""}
          rows={6}
          className="w-full rounded-xl border px-4 py-3"
        />

        <select
          name="media_type"
          defaultValue={member.media_type ?? "image"}
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
          defaultValue={member.media_url ?? member.photo_url ?? ""}
          placeholder="Or paste image URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="video_url"
          defaultValue={member.video_url ?? ""}
          placeholder="Or paste video URL"
          className="w-full rounded-xl border px-4 py-3"
        />

        <select
          name="style_preset"
          defaultValue={member.style_preset ?? "navy"}
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
          defaultValue={member.profile_highlight ?? ""}
          placeholder="Short highlight"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="profile_cta"
          defaultValue={member.profile_cta ?? "View Profile"}
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="display_order"
          type="number"
          defaultValue={member.sort_order ?? member.display_order ?? 0}
          className="w-full rounded-xl border px-4 py-3"
        />

        <label className="flex items-center gap-2">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={Boolean(member.is_active)}
          />
          <span>Show on public team page</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            name="is_featured"
            type="checkbox"
            defaultChecked={Boolean(member.is_featured)}
          />
          <span>Show on homepage</span>
        </label>

        <button type="submit" className="btn-primary">
          Update member
        </button>
      </form>
    </main>
  );
}