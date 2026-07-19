import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import TeamMedia from "@/components/TeamMedia";

type TeamMember = {
  id: string;
  name?: string | null;
  full_name?: string | null;
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
  display_order?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
};

function getName(member: TeamMember) {
  return member.full_name || member.name || "Unnamed member";
}

function getRole(member: TeamMember) {
  return (
    member.position_title || member.role_title || member.role || "Team Member"
  );
}

function getMediaUrl(member: TeamMember) {
  return member.media_url || member.photo_url || member.profile_image_url || null;
}

async function canManageTeam() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.role === "admin" || profile?.role === "manager";
  } catch {
    return false;
  }
}

export default async function TeamShowcase() {
  const admin = createAdminClient();
  const canManage = await canManageTeam();

  const { data, error } = await admin
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .or("is_featured.eq.true,is_featured.is.null")
    .order("sort_order", { ascending: true })
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("TeamShowcase error:", error.message);
    return null;
  }

  const members = (data ?? []) as TeamMember[];

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Leadership & Team
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Meet the people behind LexData
            </h2>

            <p className="mt-4 max-w-2xl text-slate-600">
              Our leadership, advisors, trainers, and coordinators support
              LexData courses, workshops, and research training programs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canManage ? (
              <Link
                href="/manager/team"
                className="inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                Manage homepage team
              </Link>
            ) : null}

            <Link
              href="/team"
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              View full team
            </Link>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              No team members yet
            </h3>
            <p className="mt-2 text-slate-600">
              Add team members from the admin or manager panel.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const name = getName(member);
              const role = getRole(member);
              const profileUrl = member.profile_slug
                ? `/team/${member.profile_slug}`
                : `/team/${member.id}`;

              return (
                <Link
                  href={profileUrl}
                  key={member.id}
                  className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
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

                    <h3 className="mt-2 text-xl font-black text-slate-950">
                      {name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {role}
                    </p>

                    {member.institution || member.organization ? (
                      <p className="mt-3 text-sm text-slate-500">
                        {member.institution || member.organization}
                      </p>
                    ) : null}

                    {member.profile_highlight ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                        {member.profile_highlight}
                      </p>
                    ) : null}

                    <span className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                      {member.profile_cta || "View Profile"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}