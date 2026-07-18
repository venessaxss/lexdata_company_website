import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import TeamMedia from "@/components/TeamMedia";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TeamMember = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  title?: string | null;
  role?: string | null;
  role_title?: string | null;
  position_title?: string | null;
  section?: string | null;
  institution?: string | null;
  organization?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  profile_image_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  video_url?: string | null;
  style_preset?: string | null;
  initials?: string | null;
  profile_slug?: string | null;
  profile_highlight?: string | null;
  profile_cta?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  display_order?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
};

function getName(member: TeamMember) {
  return member.full_name || member.name || "Unnamed member";
}

function getRole(member: TeamMember) {
  return (
    member.position_title ||
    member.role_title ||
    member.role ||
    member.title ||
    "Team Member"
  );
}

function getMediaUrl(member: TeamMember) {
  return member.media_url || member.photo_url || member.profile_image_url || null;
}

function getProfileUrl(member: TeamMember) {
  return member.profile_slug ? `/team/${member.profile_slug}` : `/team/${member.id}`;
}

function isVisible(member: TeamMember) {
  if (member.is_active === false) return false;
  if (member.is_published === false) return false;
  return true;
}

export default async function TeamPage() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load team members: ${error.message}`);
  }

  const members = ((data ?? []) as TeamMember[]).filter(isVisible);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <section className="mb-10 rounded-[2rem] bg-slate-950 p-8 text-white">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
          Our Team
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Meet the LexData team
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          Researchers, trainers, managers, advisors, and collaborators
          supporting LexData workshops and research training.
        </p>
      </section>

      {members.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
          Team information will be published soon.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const name = getName(member);
            const role = getRole(member);
            const profileUrl = getProfileUrl(member);

            return (
              <Link
                key={member.id}
                href={profileUrl}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <TeamMedia
                  name={name}
                  initials={member.initials}
                  mediaType={member.media_type}
                  mediaUrl={getMediaUrl(member)}
                  videoUrl={member.video_url}
                  stylePreset={member.style_preset}
                />

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {member.section || "Team"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950 group-hover:text-blue-700">
                    {name}
                  </h2>

                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {role}
                  </p>

                  {member.institution || member.organization ? (
                    <p className="mt-3 text-sm text-slate-500">
                      {member.institution || member.organization}
                    </p>
                  ) : null}

                  {member.bio ? (
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                      {member.bio}
                    </p>
                  ) : null}

                  <span className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 group-hover:bg-slate-100">
                    {member.profile_cta || "View Profile"}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}