import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TeamMember = {
  id: string;
  full_name: string;
  title?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  display_order?: number | null;
};

export default async function TeamPage() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("team_members")
    .select(
      `
      id,
      full_name,
      title,
      bio,
      photo_url,
      email,
      linkedin_url,
      website_url,
      display_order
    `
    )
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load team members: ${error.message}`);
  }

  const members = (data ?? []) as TeamMember[];

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
          Researchers, trainers, managers, and collaborators supporting
          LexData workshops and research training.
        </p>
      </section>

      {members.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
          Team information will be published soon.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <article
              key={member.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center bg-slate-100 text-6xl font-black text-slate-400">
                  {member.full_name.slice(0, 1)}
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-black text-slate-950">
                  {member.full_name}
                </h2>

                {member.title ? (
                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {member.title}
                  </p>
                ) : null}

                {member.bio ? (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {member.bio}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm font-bold text-slate-700 hover:text-slate-950"
                    >
                      Email
                    </a>
                  ) : null}

                  {member.linkedin_url ? (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-slate-700 hover:text-slate-950"
                    >
                      LinkedIn
                    </a>
                  ) : null}

                  {member.website_url ? (
                    <a
                      href={member.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-slate-700 hover:text-slate-950"
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}