import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import HomeControlPanelButton from "@/components/HomeControlPanelButton";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import HomeHighlightedCourses from "@/components/HomeHighlightedCourses";
import HomeMediaShowcase from "@/components/HomeMediaShowcase";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import NlpAttractionSection from "@/components/NlpAttractionSection";
import MouCollaborationSection from "@/components/MouCollaborationSection";
import TeamShowcase from "@/components/TeamShowcase";

type StatCard = {
  label: string;
  value: number;
  href: string;
};

const introCards = [
  {
    badge: "LD",
    title: "Language data",
    body: "Corpus construction and annotation pipelines with the care of a critical edition.",
    color: "peri",
  },
  {
    badge: "MT",
    title: "Translation tech",
    body: "MT evaluation and terminology systems with humans firmly in the loop.",
    color: "butter",
  },
  {
    badge: "AI",
    title: "Education",
    body: "Courses that take humanists from spreadsheets to working NLP pipelines.",
    color: "coral",
  },
];

const messageSlots = [
  {
    label: "Message slot 01",
    title: "Add homepage message here",
    body: "Use this slot later for a founder message, student note, workshop announcement, or platform update.",
  },
  {
    label: "Message slot 02",
    title: "Add announcement here",
    body: "Use this slot for deadlines, course openings, registration notices, summer schools, or research events.",
  },
  {
    label: "Message slot 03",
    title: "Add research note here",
    body: "Use this slot for corpus, NLP, translation, AI, or academic writing updates.",
  },
];

const videoSlots = [
  {
    label: "Video slot 01",
    title: "Add featured video here",
    body: "Use this slot for a hero video, workshop preview, trainer message, or embedded media.",
    href: "/manager/homepage-videos",
  },
  {
    label: "Video slot 02",
    title: "Add workshop highlight here",
    body: "Use this slot for a selected workshop recording, short preview, or promotional clip.",
    href: "/manager/homepage-videos",
  },
];

const dashboardSlots = [
  {
    label: "Dashboard slot 01",
    title: "Add chart or activity feed",
    body: "Use this slot for enrollment trends, registration summaries, payment status, or workshop analytics.",
  },
  {
    label: "Dashboard slot 02",
    title: "Add manager snapshot",
    body: "Use this slot for admin-managed reports, recent users, media uploads, or platform activity.",
  },
];

const workflowChecks = [
  "Stay in control with versioned corpora",
  "Keep judgments traceable with annotation notes",
  "Collect, annotate, model, repeat",
];

function Doodles() {
  return (
    <>
      <div className="paper-doodle paper-float paper-doodle-a" aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <path d="M20 4 L20 36 M4 20 L36 20 M9 9 L31 31 M31 9 L9 31" />
        </svg>
      </div>

      <div className="paper-doodle paper-float paper-float-slow paper-doodle-b" aria-hidden="true">
        <svg viewBox="0 0 60 40">
          <path d="M4 30 Q14 8 24 24 T44 20 T58 12" />
        </svg>
      </div>

      <div className="paper-doodle paper-float paper-doodle-c" aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <path d="M20 2 L24 15 L38 16 L27 25 L31 38 L20 30 L9 38 L13 25 L2 16 L16 15 Z" />
        </svg>
      </div>
    </>
  );
}

function HeroSection() {
  return (
    <section className="paper-hero">
      <Doodles />

      <div className="paper-wrap">
        <h1 className="paper-rev">
          LexData is a{" "}
          <span className="paper-squig">
            language-data
            <svg viewBox="0 0 300 24" preserveAspectRatio="none">
              <path d="M4 14 Q 30 4 55 13 T 105 13 T 155 12 T 205 14 T 255 12 T 296 13" />
            </svg>
          </span>{" "}
          studio made for humanists.
        </h1>

        <p className="paper-sub paper-rev" style={{ "--d": ".12s" } as React.CSSProperties}>
          Courses, corpora, and honest models - bridging the humanities and data
          science for real-world impact.
        </p>

        <div className="paper-cta paper-rev" style={{ "--d": ".24s" } as React.CSSProperties}>
          <Link className="paper-btn" href="/courses">
            Browse courses
          </Link>

          <Link className="paper-btn paper-btn-ghost" href="/workshops">
            Upcoming workshops
          </Link>
        </div>

        <p className="paper-below paper-rev" style={{ "--d": ".3s" } as React.CSSProperties}>
          No hype. No black box promises. Just language, data, and careful work.
        </p>

        <div className="paper-hero-card-zone">
          <div className="paper-annotation paper-rev" style={{ "--d": ".5s" } as React.CSSProperties}>
            <span className="paper-hand">that is us, annotating</span>
            <svg className="paper-draw" viewBox="0 0 90 70">
              <path d="M78 6 C 60 30, 44 44, 18 52 M30 44 L16 53 L32 60" />
            </svg>
          </div>

          <div className="paper-card paper-hero-doc paper-rev" style={{ "--tilt": "-2deg", "--d": ".38s" } as React.CSSProperties}>
            <div className="paper-cursors">
              <span className="paper-cursor">Researcher</span>
              <span className="paper-cursor paper-cursor-b">Annotator</span>
            </div>

            <div className="paper-doc-title">field_notes_v3 - corpus draft</div>
            <div className="paper-line paper-line-hl" />
            <div className="paper-line" />
            <div className="paper-line paper-line-hl2" />
            <div className="paper-line paper-line-short" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StripSection() {
  return (
    <div className="paper-strip" aria-hidden="true">
      <div className="paper-strip-track">
        <span>
          * made for language people * corpora with character * human-annotated
          work * built by humanists * honest benchmarks *
        </span>
        <span>
          * made for language people * corpora with character * human-annotated
          work * built by humanists * honest benchmarks *
        </span>
      </div>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  lead,
  center = false,
}: {
  kicker: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "paper-section-head paper-center" : "paper-section-head"}>
      <span className="paper-kicker paper-rev">{kicker}</span>
      <h2 className="paper-rev" style={{ "--d": ".08s" } as React.CSSProperties}>
        {title}
      </h2>

      {lead ? (
        <p className="paper-lead paper-rev" style={{ "--d": ".16s" } as React.CSSProperties}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}

function IntroSection() {
  return (
    <section className="paper-block paper-center" id="introduction">
      <div className="paper-wrap">
        <SectionHead
          kicker="Made for language people"
          title="Plenty of tools are made for dashboards and KPIs. That is not us."
          lead="LexData helps you build corpora, work with messy text, raise research standards, and celebrate language in all its forms."
          center
        />

        <div className="paper-stickers">
          {introCards.map((card, index) => (
            <article
              key={card.title}
              className="paper-sticker paper-rev"
              style={
                {
                  "--tilt": index === 1 ? "1.5deg" : index === 2 ? "-1deg" : "-2deg",
                  "--d": `${index * 0.1}s`,
                } as React.CSSProperties
              }
            >
              <div className={`paper-emoji-badge paper-badge-${card.color}`}>
                {card.badge}
              </div>

              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection({ stats }: { stats: StatCard[] }) {
  return (
    <section className="paper-block" id="dashboard">
      <div className="paper-wrap">
        <SectionHead
          kicker="Dashboard slot"
          title="Your platform activity, with room for future dashboard panels."
          lead="The first row is loaded from your database. The lower cards are reserved for charts, activity feeds, reports, or manager summaries."
        />

        <div className="paper-dashboard-grid">
          {stats.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="paper-stat-card paper-rev"
              style={{ "--d": `${index * 0.08}s` } as React.CSSProperties}
            >
              <span>{item.label}</span>
              <b>{item.value}</b>
              <p>Open -&gt;</p>
            </Link>
          ))}
        </div>

        <div className="paper-slot-grid paper-slot-grid-two">
          {dashboardSlots.map((slot, index) => (
            <article
              key={slot.label}
              className="paper-slot-card paper-rev"
              style={{ "--d": `${index * 0.1}s` } as React.CSSProperties}
            >
              <span>{slot.label}</span>
              <h3>{slot.title}</h3>
              <p>{slot.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="paper-block" id="workflow">
      <div className="paper-wrap paper-split">
        <div>
          <SectionHead
            kicker="One place for the whole arc"
            title="One place for corpora, annotation, and insight."
            lead="Your bespoke Sheets-to-scripts-to-email pipeline is not getting that paper published any faster. Streamline how you collect, label, and learn from language."
          />

          <ul className="paper-checks">
            {workflowChecks.map((item, index) => (
              <li
                key={item}
                className="paper-rev"
                style={{ "--d": `${0.2 + index * 0.1}s` } as React.CSSProperties}
              >
                <svg className="paper-draw" viewBox="0 0 26 26">
                  <path d="M3 14 L10 21 L23 4" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-card paper-rev" style={{ "--tilt": "2deg", "--d": ".2s" } as React.CSSProperties}>
          <div className="paper-doc-title">annotation_queue.tsv</div>
          <div className="paper-doc-lines">
            <div className="paper-line paper-line-hl2" />
            <div className="paper-line" />
            <div className="paper-line paper-line-hl" />
            <div className="paper-line paper-line-short" />
            <div className="paper-line paper-line-hl2" />
          </div>

          <p className="paper-hand paper-doc-note">every label, accounted for</p>
        </div>
      </div>
    </section>
  );
}

function PaperPanel({
  kicker,
  title,
  lead,
  children,
  id,
}: {
  kicker: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="paper-block" id={id}>
      <div className="paper-wrap">
        <SectionHead kicker={kicker} title={title} lead={lead} />
        <div className="paper-dynamic-panel paper-rev">{children}</div>
      </div>
    </section>
  );
}

function VideoSection({
  homepageVideos,
  canManageHomepage,
}: {
  homepageVideos: any[];
  canManageHomepage: boolean;
}) {
  return (
    <section className="paper-block" id="videos">
      <div className="paper-wrap">
        <SectionHead
          kicker="Video slots"
          title="Videos, previews, and media highlights."
          lead="Your dynamic video components are preserved, and separate manual video slots are left below for future additions."
        />

        <div className="paper-dynamic-panel paper-rev">
          <HomeMediaShowcase
            videos={homepageVideos}
            canManage={canManageHomepage}
          />
        </div>

        <div className="paper-dynamic-panel paper-dynamic-panel-gap paper-rev">
          <LatestWorkshopVideos />
        </div>

        <div className="paper-slot-grid">
          {videoSlots.map((slot, index) => (
            <Link
              key={slot.label}
              href={slot.href}
              className="paper-slot-card paper-rev"
              style={{ "--d": `${index * 0.1}s` } as React.CSSProperties}
            >
              <span>{slot.label}</span>
              <h3>{slot.title}</h3>
              <p>{slot.body}</p>
              <b>Manage videos -&gt;</b>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MessageSection() {
  return (
    <section className="paper-block" id="messages">
      <div className="paper-wrap">
        <SectionHead
          kicker="Message slots"
          title="Messages, announcements, and updates."
          lead="These message cards are separate placeholders. Later, you can connect them to an admin-managed database table."
        />

        <div className="paper-slot-grid">
          {messageSlots.map((slot, index) => (
            <article
              key={slot.label}
              className="paper-slot-card paper-rev"
              style={{ "--d": `${index * 0.1}s` } as React.CSSProperties}
            >
              <span>{slot.label}</span>
              <h3>{slot.title}</h3>
              <p>{slot.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StanceBand() {
  return (
    <section className="paper-band" id="stance">
      <div className="paper-wrap">
        <span className="paper-kicker paper-rev">A principled alternative</span>

        <h2 className="paper-rev" style={{ "--d": ".08s" } as React.CSSProperties}>
          By humanists, for humanists.
        </h2>

        <p className="paper-lead paper-rev" style={{ "--d": ".16s" } as React.CSSProperties}>
          Researchers and learners should be free to work with language away
          from black boxes, inflated claims, and careless data practices.
        </p>

        <div className="paper-badges">
          <span className="paper-badge paper-rev" style={{ "--tilt": "-2deg", "--d": ".2s" } as React.CSSProperties}>
            Your data is yours.
          </span>

          <span className="paper-badge paper-badge-butter paper-rev" style={{ "--tilt": "2deg", "--d": ".3s" } as React.CSSProperties}>
            Human-annotated work.
          </span>

          <span className="paper-badge paper-badge-coral paper-rev" style={{ "--tilt": "-1deg", "--d": ".4s" } as React.CSSProperties}>
            Honest benchmarks.
          </span>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="paper-closing" id="courses">
      <div className="paper-wrap">
        <p className="paper-count paper-rev">
          Trusted by <span>human learners</span>, researchers, and educators.
        </p>

        <h2 className="paper-rev" style={{ "--d": ".1s" } as React.CSSProperties}>
          Get started with LexData today.
        </h2>

        <div className="paper-cta paper-rev" style={{ "--d": ".2s" } as React.CSSProperties}>
          <Link className="paper-btn paper-btn-coral" href="/workshops">
            Upcoming workshops
          </Link>

          <Link className="paper-btn paper-btn-ghost" href="/courses">
            Browse courses
          </Link>
        </div>
      </div>
    </section>
  );
}

function PaperFooter() {
  return (
    <footer className="paper-footer">
      <div className="paper-wrap">
        <div className="paper-footer-cols">
          <div>
            <Link className="paper-footer-logo" href="/">
              LexData...
            </Link>

            <p>
              Intelligent data solutions for language, translation, education,
              and society.
            </p>
          </div>

          <nav>
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/workshops">Workshops</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>

          <blockquote>
            The limits of my language mean the limits of my world.
            <cite>- Ludwig Wittgenstein</cite>
          </blockquote>
        </div>

        <div className="paper-footer-bottom">
          <span>© 2026 LexData</span>
          <span>made by humans</span>
        </div>
      </div>
    </footer>
  );
}

export default async function IntegratedHomePage() {
  const admin = createAdminClient();

  let canManageHomepage = false;
  let homepageVideos: any[] = [];

  let stats: StatCard[] = [
    { label: "Published courses", value: 0, href: "/courses" },
    { label: "Active workshops", value: 0, href: "/workshops" },
    { label: "Video highlights", value: 0, href: "#videos" },
    { label: "Team members", value: 0, href: "/team" },
  ];

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError) {
        canManageHomepage =
          profile?.role === "admin" || profile?.role === "manager";
      }
    }

    let homepageVideosQuery = admin
      .from("homepage_videos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!canManageHomepage) {
      homepageVideosQuery = homepageVideosQuery.eq("is_active", true);
    }

    const { data: videosData, error: videosError } = await homepageVideosQuery;

    if (!videosError) {
      homepageVideos = videosData ?? [];
    }

    const [coursesCount, workshopsCount, videosCount, teamCount] =
      await Promise.all([
        admin
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),

        admin
          .from("workshops")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),

        admin
          .from("homepage_videos")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        admin
          .from("team_members")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

    stats = [
      {
        label: "Published courses",
        value: coursesCount.count ?? 0,
        href: "/courses",
      },
      {
        label: "Active workshops",
        value: workshopsCount.count ?? 0,
        href: "/workshops",
      },
      {
        label: "Video highlights",
        value: videosCount.count ?? 0,
        href: "#videos",
      },
      {
        label: "Team members",
        value: teamCount.count ?? 0,
        href: "/team",
      },
    ];
  } catch (error) {
    console.error("Integrated homepage error:", error);
    homepageVideos = [];
    canManageHomepage = false;
  }

  return (
    <>
      <HomeControlPanelButton />

      <main className="paper-home">
        <HeroSection />
        <StripSection />
        <IntroSection />
        <DashboardSection stats={stats} />

        <PaperPanel
          id="showcase"
          kicker="Homepage showcase"
          title="Featured LexData announcements and highlights."
          lead="This keeps your original admin-managed homepage showcase inside the new paper style."
        >
          <DynamicHomeShowcase />
        </PaperPanel>

        <PaperPanel
          id="courses"
          kicker="Highlighted courses"
          title="Featured courses from your course dashboard."
          lead="This keeps the original dynamic course highlight component."
        >
          <HomeHighlightedCourses />
        </PaperPanel>

        <WorkflowSection />

        <VideoSection
          homepageVideos={homepageVideos}
          canManageHomepage={canManageHomepage}
        />

        <MessageSection />
        <StanceBand />

        <PaperPanel
          id="nlp"
          kicker="NLP attraction"
          title="Why language data matters."
          lead="This keeps the original NLP attraction section."
        >
          <NlpAttractionSection />
        </PaperPanel>

        <PaperPanel
          id="collaboration"
          kicker="Collaboration"
          title="Partnerships, MoUs, and academic cooperation."
          lead="This keeps your original collaboration and MoU section."
        >
          <MouCollaborationSection />
        </PaperPanel>

        <PaperPanel
          id="team"
          kicker="LexData team"
          title="Dynamic team presentation."
          lead="This keeps your original dynamic team data and profile links."
        >
          <TeamShowcase />
        </PaperPanel>

        <ClosingSection />
        <PaperFooter />
      </main>
    </>
  );
}