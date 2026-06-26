import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  initials?: string | null;
  profile_slug?: string | null;

  display_order?: number | null;
  sort_order?: number | null;

  is_active?: boolean | null;
  is_featured?: boolean | null;

  media_type?: string | null;
  media_url?: string | null;
  video_url?: string | null;
  style_preset?: string | null;
  profile_highlight?: string | null;
  profile_cta?: string | null;
};

const sectionOrder = [
  "Executive Leadership",
  "Advisory Board",
  "Core Team",
];

function getName(member: TeamMember) {
  return member.full_name || member.name || "Unnamed member";
}

function getRole(member: TeamMember) {
  return (
    member.position_title ||
    member.role_title ||
    member.role ||
    "Team Member"
  );
}

function getSection(member: TeamMember) {
  return member.section || "Core Team";
}

function getMediaUrl(member: TeamMember) {
  return member.media_url || member.photo_url || member.profile_image_url || null;
}

function getOrder(member: TeamMember) {
  return member.sort_order ?? member.display_order ?? 999;
}

function groupMembers(members: TeamMember[]) {
  const groups = new Map<string, TeamMember[]>();

  for (const member of members) {
    const section = getSection(member);

    if (!groups.has(section)) {
      groups.set(section, []);
    }

    groups.get(section)?.push(member);
  }

  for (const [, sectionMembers] of groups) {
    sectionMembers.sort((a, b) => getOrder(a) - getOrder(b));
  }

  return sectionOrder
    .filter((section) => groups.has(section))
    .map((section) => ({
      section,
      members: groups.get(section) ?? [],
    }));
}

export default async function TeamPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const members = (data ?? []) as TeamMember[];
  const groupedMembers = groupMembers(members);

  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Leadership & Team
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Meet the people behind LexData
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Our team brings together executive leadership, scientific advisors,
              curriculum experts, AI trainers, Python trainers, and technical
              coordinators to support high-quality courses, workshops, and
              research training.
            </p>
          </div>
        </div>
      </section>

      {/* Team Sections */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        {groupedMembers.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              No team members yet
            </h2>
            <p className="mt-3 text-slate-600">
              Team members added by admin or manager will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedMembers.map(({ section, members }) => (
              <section key={section}>
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {section}
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      {section}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => {
                    const name = getName(member);
                    const role = getRole(member);
                    const mediaUrl = getMediaUrl(member);
                    const profileUrl = member.profile_slug
                      ? `/team/${member.profile_slug}`
                      : `/team/${member.id}`;

                    return (
                      <article
                        key={member.id}
                        className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <TeamMedia
                          name={name}
                          initials={member.initials}
                          mediaType={member.media_type}
                          mediaUrl={mediaUrl}
                          videoUrl={member.video_url}
                          stylePreset={member.style_preset}
                        />

                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-black text-slate-950">
                                {name}
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                {role}
                              </p>
                            </div>

                            {member.is_featured ? (
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                                Featured
                              </span>
                            ) : null}
                          </div>

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

                          {member.bio ? (
                            <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                              {member.bio}
                            </p>
                          ) : null}

                          <Link
                            href={profileUrl}
                            className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                          >
                            {member.profile_cta || "View Profile"}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}