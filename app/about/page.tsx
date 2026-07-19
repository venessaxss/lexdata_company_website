import Link from "next/link";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AboutReveal from "@/components/AboutReveal";
import { getCurrentProfile } from "@/lib/auth";
import { isManagerRole } from "@/lib/roles";
import "./about.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AboutSection = {
  id: string;
  kicker: string | null;
  heading: string | null;
  body: string | null;
  items: string[] | null;
  is_active: boolean;
};

type TeamMember = {
  id: string;
  full_name: string | null;
  title: string | null;
  photo_url: string | null;
};

/* Fallbacks keep the page whole before the 004 migration runs
   or if a section is deactivated in the editor. */
const FALLBACK: Record<string, AboutSection> = {
  intro: {
    id: "intro",
    kicker: "Who we are",
    heading: "We're humanists who build data systems.",
    body: "LexData is a research-driven data solutions company focused on language sciences, translation, education, ELT, and social sciences. We specialize in the collection, processing, analysis, and interpretation of large datasets using Python, R, NLP, and data science workflows.",
    items: [],
    is_active: true,
  },
  mission: {
    id: "mission",
    kicker: "Our mission",
    heading: "Bridging humanities and data science for real-world impact.",
    body: "We help researchers, translators, and educators turn language into evidence — with methods that stand up to review and results you can explain.",
    items: [],
    is_active: true,
  },
  why: {
    id: "why",
    kicker: "Why LexData?",
    heading: "The bridge, not just the code.",
    body: null,
    items: [
      "Built by researchers who publish, not just ship",
      "Multilingual by default — English, 中文, العربية and beyond",
      "Every claim backed by an evaluation you can see",
      "Training that meets humanists where they are",
    ],
    is_active: true,
  },
  aims: {
    id: "aims",
    kicker: "Our aims",
    heading: "Three things we're building toward.",
    body: null,
    items: [
      "Research-grade language data | Corpora and annotation pipelines with the care of a critical edition.",
      "Honest, useful models | Trained on documented data, benchmarked in the open, never oversold.",
      "A wider door into data science | Courses and workshops that turn language people into data people.",
    ],
    is_active: true,
  },
  stance: {
    id: "stance",
    kicker: "A principled alternative",
    heading: "By humanists, for humanists.",
    body: "We think researchers and learners should be free to work with language — away from black boxes, inflated claims, and the prying eyes of data brokers.",
    items: [
      "Your data is YOURS.",
      "Human-annotated — always.",
      "Honest benchmarks. No hype.",
    ],
    is_active: true,
  },
  quote: {
    id: "quote",
    kicker: null,
    heading: null,
    body: "The limits of my language mean the limits of my world.",
    items: ["Ludwig Wittgenstein"],
    is_active: true,
  },
};

const AIM_STYLES = [
  { emoji: "📚", bg: "var(--ab-peri-soft)", tilt: "-2deg" },
  { emoji: "🔬", bg: "var(--ab-butter)", tilt: "1.5deg" },
  { emoji: "🎓", bg: "#f9c9bb", tilt: "-1deg" },
];

function Check() {
  return (
    <svg className="ab-draw" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M3 14 L10 21 L23 4" />
    </svg>
  );
}

export default async function AboutPage() {
  const supabase = await createClient();

  const { data: sectionRows } = await supabase
    .from("about_sections")
    .select("id,kicker,heading,body,items,is_active")
    .order("sort", { ascending: true });

  const sections: Record<string, AboutSection> = { ...FALLBACK };
  (sectionRows ?? []).forEach((row) => {
    if (row?.id && FALLBACK[row.id]) {
      sections[row.id] = {
        ...FALLBACK[row.id],
        ...row,
        items: Array.isArray(row.items) ? (row.items as string[]) : [],
      };
    }
  });

  let team: TeamMember[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("team_members")
      .select("id,full_name,title,photo_url")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .limit(8);
    team = (data ?? []) as TeamMember[];
  } catch {
    team = [];
  }

  const profile = await getCurrentProfile();
  const canEdit = isManagerRole(profile?.role);
  const editHref =
    profile?.role === "admin" ? "/admin/about" : "/manager/about";

  const { intro, mission, why, aims, stance, quote } = sections as {
    [k: string]: AboutSection;
  };

  return (
    <div className="ab-root">
      <AboutReveal />

      {/* ---------- hero ---------- */}
      <section className="ab-hero">
        <div className="ab-doodle ab-float" style={{ "--r": "-8deg", top: 90, left: "7%", width: 52 } as CSSProperties}>
          <svg viewBox="0 0 40 40"><path d="M20 4 L20 36 M4 20 L36 20 M9 9 L31 31 M31 9 L9 31" /></svg>
        </div>
        <div className="ab-doodle ab-float slow coral" style={{ "--r": "10deg", top: 70, right: "8%", width: 66 } as CSSProperties}>
          <svg viewBox="0 0 60 40"><path d="M4 30 Q14 8 24 24 T44 20 T58 12" /></svg>
        </div>
        <div className="ab-wrap">
          {canEdit ? (
            <p style={{ marginBottom: 16 }}>
              <Link href={editHref} className="ab-btn" style={{ fontSize: 14, padding: "8px 18px" }}>
                ✏️ Edit this page
              </Link>
            </p>
          ) : null}
          <span className="ab-kicker ab-rev">{intro.kicker}</span>
          <h1 className="ab-rev" style={{ "--d": ".08s" } as CSSProperties}>
            We&rsquo;re{" "}
            <span className="ab-squig">
              humanists
              <svg viewBox="0 0 300 24" preserveAspectRatio="none">
                <path d="M4 14 Q 30 4 55 13 T 105 13 T 155 12 T 205 14 T 255 12 T 296 13" />
              </svg>
            </span>{" "}
            who build data systems.
          </h1>
          <p className="ab-sub ab-rev" style={{ "--d": ".16s" } as CSSProperties}>
            {intro.body}
          </p>
          <p className="ab-note ab-hand ab-rev" style={{ "--d": ".28s" } as CSSProperties}>
            ↓ scroll for the whole story ↓
          </p>
        </div>
      </section>

      {/* ---------- mission + why ---------- */}
      <section className="ab-block" style={{ paddingTop: 20 }}>
        <div className="ab-wrap">
          <div className="ab-grid2">
            {mission.is_active ? (
              <div className="ab-card ab-sticker ab-rev" style={{ "--tilt": "-1.5deg" } as CSSProperties}>
                <span className="ab-kicker">{mission.kicker}</span>
                <h3 style={{ marginTop: 10 }}>{mission.heading}</h3>
                <p style={{ marginTop: 10 }}>{mission.body}</p>
              </div>
            ) : null}
            {why.is_active ? (
              <div className="ab-card ab-sticker ab-rev" style={{ "--tilt": "1.5deg", "--d": ".1s" } as CSSProperties}>
                <span className="ab-kicker">{why.kicker}</span>
                <h3 style={{ marginTop: 10 }}>{why.heading}</h3>
                <ul className="ab-checks">
                  {(why.items ?? []).map((item) => (
                    <li key={item}>
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------- aims ---------- */}
      {aims.is_active ? (
        <section className="ab-block ab-center" style={{ paddingTop: 10 }}>
          <div className="ab-wrap">
            <span className="ab-kicker ab-rev">{aims.kicker}</span>
            <h2 className="ab-rev" style={{ "--d": ".08s" } as CSSProperties}>{aims.heading}</h2>
            <div className="ab-grid3">
              {(aims.items ?? []).map((raw, i) => {
                const [title, body] = raw.split("|").map((s) => s.trim());
                const s = AIM_STYLES[i % AIM_STYLES.length];
                return (
                  <div
                    key={raw}
                    className="ab-card ab-sticker ab-rev"
                    style={{ "--tilt": s.tilt, "--d": `${i * 0.1}s`, textAlign: "left" } as CSSProperties}
                  >
                    <div className="ab-emoji" style={{ "--bg": s.bg } as CSSProperties}>{s.emoji}</div>
                    <h3>{title}</h3>
                    <p style={{ marginTop: 8 }}>{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- team ---------- */}
      {team.length > 0 ? (
        <section className="ab-block ab-center" style={{ paddingTop: 10 }}>
          <div className="ab-doodle ab-float peri" style={{ "--r": "6deg", top: 40, right: "10%", width: 46 } as CSSProperties}>
            <svg viewBox="0 0 40 40"><path d="M20 2 L24 15 L38 16 L27 25 L31 38 L20 30 L9 38 L13 25 L2 16 L16 15 Z" /></svg>
          </div>
          <div className="ab-wrap">
            <span className="ab-kicker ab-rev">The people</span>
            <h2 className="ab-rev" style={{ "--d": ".08s" } as CSSProperties}>That&rsquo;s us, collaborating!</h2>
            <div className="ab-team">
              {team.map((member, i) => (
                <div key={member.id} className="ab-member ab-rev" style={{ "--d": `${i * 0.08}s` } as CSSProperties}>
                  <div className="ab-photo" style={{ "--tilt": i % 2 ? "2deg" : "-2deg" } as CSSProperties}>
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photo_url} alt={member.full_name ?? "Team member"} />
                    ) : (
                      <span>{(member.full_name ?? "?").charAt(0)}</span>
                    )}
                  </div>
                  <h3>{member.full_name}</h3>
                  <p className="ab-role">{member.title}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 30 }} className="ab-rev">
              <Link href="/team" className="ab-btn">Meet the whole team →</Link>
            </p>
          </div>
        </section>
      ) : null}

      {/* ---------- stance band ---------- */}
      {stance.is_active ? (
        <section className="ab-band">
          <div className="ab-doodle ab-float" style={{ "--r": "-6deg", top: 40, right: "6%", width: 56 } as CSSProperties}>
            <svg viewBox="0 0 50 50"><path d="M25 4 C 12 4 6 14 6 24 C 6 36 16 44 25 46 C 34 44 44 36 44 24 C 44 14 38 4 25 4 Z M17 22 Q25 30 33 22" /></svg>
          </div>
          <div className="ab-wrap">
            <span className="ab-kicker ab-rev" style={{ color: "var(--ab-ink)" }}>{stance.kicker}</span>
            <h2 className="ab-rev" style={{ "--d": ".08s" } as CSSProperties}>{stance.heading}</h2>
            <p className="ab-lead ab-rev" style={{ "--d": ".16s" } as CSSProperties}>{stance.body}</p>
            <div className="ab-badges">
              {(stance.items ?? []).map((badge, i) => (
                <span
                  key={badge}
                  className="ab-badge ab-rev"
                  style={{ "--tilt": i % 2 ? "2deg" : "-2deg", "--d": `${0.2 + i * 0.1}s` } as CSSProperties}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- quote + CTA ---------- */}
      <section className="ab-quotewrap">
        <div className="ab-wrap">
          {quote.is_active && quote.body ? (
            <blockquote className="ab-quote ab-rev">
              &ldquo;{quote.body}&rdquo;
              <cite>— {(quote.items ?? [])[0] ?? ""}</cite>
            </blockquote>
          ) : null}
          <p style={{ marginTop: 40 }} className="ab-rev">
            <Link href="/workshops" className="ab-btn coral">Join a workshop →</Link>{" "}
            <Link href="/contact" className="ab-btn" style={{ marginLeft: 10 }}>Say hello</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
