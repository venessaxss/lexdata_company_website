import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

type TeamMember = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  role?: string | null;
  role_title?: string | null;
  position_title?: string | null;
  bio?: string | null;
  initials?: string | null;
  section?: string | null;
  sort_order?: number | null;
};

function nameOf(member: TeamMember) {
  return member.full_name || member.name || "LexData member";
}

function roleOf(member: TeamMember) {
  return member.position_title || member.role_title || member.role || "Team member";
}

function initialsOf(member: TeamMember) {
  const name = nameOf(member);
  if (member.initials) return member.initials;
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(9);

  const members = (data ?? []) as TeamMember[];

  return (
    <main className="ell-about-page">
      <section className="ell-container ell-about-hero">
        <div>
          <p className="ell-eyebrow">About LexData</p>
          <h1>Made by people who care about language, data, and learning.</h1>
        </div>
        <p>
          {site.name} is a research-driven platform for language sciences,
          translation, education, AI, and social data. Like the Ellipsus about
          page feeling, this page is built as a warm paper-style team wall: human,
          editorial, visual, and easy to read.
        </p>
      </section>

      <section className="ell-container ell-team-wall">
        {members.length === 0 ? (
          ["Research", "Training", "Technology"].map((item) => (
            <article className="ell-team-card" key={item}>
              <div className="ell-team-media">{item.slice(0, 1)}</div>
              <div className="ell-team-body">
                <p className="ell-eyebrow">LexData team</p>
                <h2>{item} team</h2>
                <p>
                  Add team members from the admin or manager dashboard and they
                  will render here automatically.
                </p>
              </div>
            </article>
          ))
        ) : (
          members.map((member) => (
            <article className="ell-team-card" key={member.id}>
              <div className="ell-team-media">{initialsOf(member)}</div>
              <div className="ell-team-body">
                <p className="ell-eyebrow">{member.section || "LexData team"}</p>
                <h2>{nameOf(member)}</h2>
                <p><strong>{roleOf(member)}</strong></p>
                {member.bio ? <p>{member.bio}</p> : null}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
