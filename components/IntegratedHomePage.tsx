import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomepageContentSlots } from "@/lib/homepage-content";

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

type Slot = {
  key: string;
  label: string;
  title: string;
  body: string;
  href: string;
  is_active: boolean;
  sort_order: number;
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

function getSlot(slots: Record<string, Slot>, key: string) {
  return slots[key];
}

function FloatingLetters() {
  const letters = ["l", "a", "n", "g", "u", "a", "g", "e", "d", "a", "t", "a"];

  return (
    <div className="paper-hero-letters" aria-hidden="true">
      {letters.map((letter, index) => (
        <span key={`${letter}-${index}`}>{letter}</span>
      ))}
    </div>
  );
}

function HeroSection({
  slots,
  canManageHomepage,
}: {
  slots: Record<string, Slot>;
  canManageHomepage: boolean;
}) {
  const title = getSlot(slots, "hero_title");
  const subtitle = getSlot(slots, "hero_subtitle");
  const primary = getSlot(slots, "hero_primary_button");
  const secondary = getSlot(slots, "hero_secondary_button");

  return (
    <section className="paper-ellipsus-hero">
      <FloatingLetters />

      <div className="paper-plane-doodle" aria-hidden="true">
        <svg viewBox="0 0 180 150">
          <path d="M12 82 L160 18 L90 132 L72 92 L12 82 Z" />
          <path d="M72 92 L160 18" />
        </svg>
      </div>

      <div className="paper-purple-cursor" aria-hidden="true">
        <svg viewBox="0 0 80 90">
          <path d="M12 8 L68 48 L43 54 L34 82 Z" />
        </svg>
      </div>

      <div className="paper-hero-center">
        <h1 className="paper-rev">{title?.title || "Write like a human."}</h1>

        <p className="paper-hero-sub paper-rev">
          {subtitle?.title ||
            "LexData is a language-data studio made for humanists."}
        </p>

        <div className="paper-hero-actions paper-rev">
          <Link className="paper-hero-btn" href={primary?.href || "/signup"}>
            {primary?.title || "Join for free"}
          </Link>

          <Link className="paper-hero-btn paper-hero-btn-ghost" href={secondary?.href || "/courses"}>
            {secondary?.title || "Browse courses"}
          </Link>
        </div>

        {canManageHomepage ? (
          <Link href="/admin/homepage-content" className="paper-edit-homepage">
            Edit homepage content
          </Link>
        ) : null}
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

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="paper-section-head">
      <span className="paper-kicker paper-rev">{kicker}</span>
      <h2 className="paper-rev">{title}</h2>
    </div>
  );
}

function IntroSection() {
  return (
    <section className="paper-block paper-page paper-center" id="introduction">
      <div className="paper-wrap">
        <SectionHead
          kicker="Made for language people"
          title="Tools for corpora, language data, and human-centered AI."
        />

        <div className="paper-stickers">
          {introCards.map((card, index) => (
            <article
              key={card.title}
              className="paper-sticker paper-rev paper-turn"
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

function DashboardSection({
  stats,
  slots,
}: {
  stats: StatCard[];
  slots: Record<string, Slot>;
}) {
  const dashboardSlots = [
    getSlot(slots, "dashboard_slot_01"),
    getSlot(slots, "dashboard_slot_02"),
  ].filter(Boolean);

  return (
    <section className="paper-block paper-page" id="dashboard">
      <div className="paper-wrap">
        <SectionHead
          kicker="Dashboard"
          title="Live activity and editable dashboard slots."
        />

        <div className="paper-dashboard-grid">
          {stats.map((item) => (
            <Link key={item.label} href={item.href} className="paper-stat-card paper-rev paper-turn">
              <span>{item.label}</span>
              <b>{item.value}</b>
              <p>Open -&gt;</p>
            </Link>
          ))}
        </div>

        <div className="paper-slot-grid paper-slot-grid-two">
          {dashboardSlots.map((slot) => (
            <article key={slot.key} className="paper-slot-card paper-rev paper-turn">
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

function PaperPanel({
  kicker,
  title,
  children,
  id,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="paper-block paper-page" id={id}>
      <div className="paper-wrap">
        <SectionHead kicker={kicker} title={title} />
        <div className="paper-dynamic-panel paper-rev paper-turn">{children}</div>
      </div>
    </section>
  );
}

function VideoSection({
  homepageVideos,
  canManageHomepage,
  slots,
}: {
  homepageVideos: any[];
  canManageHomepage: boolean;
  slots: Record<string, Slot>;
}) {
  const videoSlots = [
    getSlot(slots, "video_slot_01"),
    getSlot(slots, "video_slot_02"),
  ].filter(Boolean);

  return (
    <section className="paper-block paper-page" id="videos">
      <div className="paper-wrap">
        <SectionHead kicker="Videos" title="Videos, previews, and media highlights." />

        <div className="paper-dynamic-panel paper-rev paper-turn">
          <HomeMediaShowcase
            videos={homepageVideos}
            canManage={canManageHomepage}
          />
        </div>

        <div className="paper-dynamic-panel paper-dynamic-panel-gap paper-rev paper-turn">
          <LatestWorkshopVideos />
        </div>

        <div className="paper-slot-grid">
          {videoSlots.map((slot) => (
            <Link
              key={slot.key}
              href={slot.href || "/manager/homepage-videos"}
              className="paper-slot-card paper-rev paper-turn"
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

function MessageSection({ slots }: { slots: Record<string, Slot> }) {
  const messageSlots = [
    getSlot(slots, "message_slot_01"),
    getSlot(slots, "message_slot_02"),
    getSlot(slots, "message_slot_03"),
  ].filter(Boolean);

  return (
    <section className="paper-block paper-page" id="messages">
      <div className="paper-wrap">
        <SectionHead kicker="Messages" title="Messages, announcements, and updates." />

        <div className="paper-slot-grid">
          {messageSlots.map((slot) => (
            <article key={slot.key} className="paper-slot-card paper-rev paper-turn">
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
    <section className="paper-band paper-page" id="stance">
      <div className="paper-wrap">
        <span className="paper-kicker paper-rev">A principled alternative</span>

        <h2 className="paper-rev">By humanists, for humanists.</h2>

        <div className="paper-badges">
          <span className="paper-badge paper-rev">Your data is yours.</span>
          <span className="paper-badge paper-badge-butter paper-rev">
            Human-annotated work.
          </span>
          <span className="paper-badge paper-badge-coral paper-rev">
            Honest benchmarks.
          </span>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="paper-closing paper-page" id="courses">
      <div className="paper-wrap">
        <p className="paper-count paper-rev">
          Trusted by <span>human learners</span>, researchers, and educators.
        </p>

        <h2 className="paper-rev">Get started with LexData today.</h2>

        <div className="paper-cta paper-rev">
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

  const slots = await getHomepageContentSlots();

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
      { label: "Published courses", value: coursesCount.count ?? 0, href: "/courses" },
      { label: "Active workshops", value: workshopsCount.count ?? 0, href: "/workshops" },
      { label: "Video highlights", value: videosCount.count ?? 0, href: "#videos" },
      { label: "Team members", value: teamCount.count ?? 0, href: "/team" },
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
        <HeroSection slots={slots} canManageHomepage={canManageHomepage} />
        <StripSection />
        <IntroSection />
        <DashboardSection stats={stats} slots={slots} />

        <PaperPanel
          id="showcase"
          kicker="Homepage showcase"
          title="Featured LexData announcements and highlights."
        >
          <DynamicHomeShowcase />
        </PaperPanel>

        <PaperPanel
          id="courses"
          kicker="Highlighted courses"
          title="Featured courses from your course dashboard."
        >
          <HomeHighlightedCourses />
        </PaperPanel>

        <VideoSection
          homepageVideos={homepageVideos}
          canManageHomepage={canManageHomepage}
          slots={slots}
        />

        <MessageSection slots={slots} />
        <StanceBand />

        <PaperPanel id="nlp" kicker="NLP attraction" title="Why language data matters.">
          <NlpAttractionSection />
        </PaperPanel>

        <PaperPanel
          id="collaboration"
          kicker="Collaboration"
          title="Partnerships, MoUs, and academic cooperation."
        >
          <MouCollaborationSection />
        </PaperPanel>

        <PaperPanel id="team" kicker="LexData team" title="Dynamic team presentation.">
          <TeamShowcase />
        </PaperPanel>

        <ClosingSection />
        <PaperFooter />
      </main>
    </>
  );
}