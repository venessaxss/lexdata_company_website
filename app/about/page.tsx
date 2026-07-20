import PaperTypewriterLine from "@/components/PaperTypewriterLine";
import EllipsusNav from "@/components/EllipsusNav";
import AboutTeamWall from "@/components/AboutTeamWall";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
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
  location?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  portrait_url?: string | null;
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
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function photoOf(member: TeamMember) {
  return member.photo_url || member.image_url || member.avatar_url || member.portrait_url || null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const [supabase, profile] = await Promise.all([createClient(), getCurrentProfile()]);
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(9);

  const members = ((data ?? []) as TeamMember[]).map((member) => ({
    id: member.id,
    name: nameOf(member),
    role: roleOf(member),
    bio: member.bio || null,
    location: member.location || member.section || "LexData",
    initials: initialsOf(member),
    photo: photoOf(member),
  }));

  return (
    <main className="lx-about-page">
      <EllipsusNav isLoggedIn={Boolean(profile)} />

      <section className="lx-about-hero">
        <div className="lx-floating-letters lx-about-letters" aria-hidden="true">
          {Array.from("ourstorylexdata").map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ "--i": index } as React.CSSProperties}>{letter}</span>
          ))}
        </div>
        <h1><PaperTypewriterLine phrases={["Our story, so far...", "People before platforms.", "Research with a human pulse."]} /></h1>
      </section>

      <section className="lx-about-story" id="story">
        <div className="lx-story-mark">01</div>
        <div>
          <p className="lx-story-kicker">Our story</p>
          <h2>{site.name} was built to make serious research feel more human.</h2>
          <p>
            We bring language science, translation, education, AI, and social data into one practical environment - without turning the researcher into a passenger.
          </p>
          <p>
            The platform connects workshops, cases, messages, media, and collaborative workflows so people can move from an idea to an evidence-based outcome while keeping context, judgment, and creativity intact.
          </p>
        </div>
        <div className="lx-story-doodle" aria-hidden="true">*<br />~<br />P</div>
      </section>

      <section className="lx-team-section" id="team">
        <div className="lx-team-title">
          <p>The humans behind the work</p>
          <h2>Meet the team</h2>
        </div>
        <AboutTeamWall members={members} />
      </section>
    </main>
  );
}