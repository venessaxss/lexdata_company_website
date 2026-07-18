import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import TeamMedia from "@/components/TeamMedia";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function getMediaUrl(member: any) {
  return member.media_url || member.photo_url || member.profile_image_url || null;
}

function isVisible(member: any) {
  if (member.is_active === false) return false;
  if (member.is_published === false) return false;
  return true;
}

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: member, error } = await admin
    .from("team_members")
    .select("*")
    .or(`profile_slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (error || !member || !isVisible(member)) {
    notFound();
  }

  const name = getName(member);
  const role = getRole(member);

  return (
    <main className="bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/team"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Back to team
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-0 lg:grid-cols-[420px_1fr]">
            <div className="bg-slate-100">
              <TeamMedia
                name={name}
                initials={member.initials}
                mediaType={member.media_type}
                mediaUrl={getMediaUrl(member)}
                videoUrl={member.video_url}
                stylePreset={member.style_preset}
              />
            </div>

            <div className="p-8 md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
                {member.section || "LexData Team"}
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {name}
              </h1>

              <p className="mt-3 text-lg font-bold text-slate-700">{role}</p>

              {member.institution || member.organization ? (
                <p className="mt-2 text-base font-semibold text-slate-500">
                  {member.institution || member.organization}
                </p>
              ) : null}

              {member.profile_highlight ? (
                <div className="mt-6 rounded-3xl bg-blue-50 p-5 text-sm font-bold leading-7 text-blue-900">
                  {member.profile_highlight}
                </div>
              ) : null}

              {member.bio ? (
                <div className="mt-8">
                  <h2 className="text-xl font-black text-slate-950">
                    Profile
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">
                    {member.bio}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Email
                  </a>
                ) : null}

                {member.linkedin_url ? (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    LinkedIn
                  </a>
                ) : null}

                {member.website_url ? (
                  <a
                    href={member.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Website
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}