import Link from "next/link";
import type React from "react";
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
import PreviousCasesShowcase from "@/components/PreviousCasesShowcase";
import PaperTypewriterLine from "@/components/PaperTypewriterLine";

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
  const typingMessages = [
    subtitle?.title,
    getSlot(slots, "hero_typing_01")?.title,
    getSlot(slots, "hero_typing_02")?.title,
    getSlot(slots, "hero_typing_03")?.title,
    getSlot(slots, "hero_typing_04")?.title,
  ].filter(Boolean) as string[];
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
        <Link href="/" className="paper-hero-logo paper-rev" aria-label="LexData home">
          <span>LexData</span>
        </Link>
        <h1 className="paper-rev">{title?.title || "Write like a human."}</h1>

        <PaperTypewriterLine messages={typingMessages} />

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


function LexDataDarkStorySection() {
  return (
    <section className="lex-dark-story paper-page">
      <div className="lex-dark-doodle lex-dark-doodle-left" aria-hidden="true">
        <svg viewBox="0 0 220 170">
          <path d="M35 116h92M52 94h78M67 73h56M52 45h78l18 49-18 49H52L34 94Z" />
          <path d="M142 94h45M158 77l28 17-28 17" />
        </svg>
      </div>

      <div className="lex-dark-doodle lex-dark-doodle-right" aria-hidden="true">
        <svg viewBox="0 0 220 180">
          <path d="M112 142V45M112 45l45 28M112 45 66 76" />
          <path d="M76 89c-21-18-47 11-20 34 8 7 20 13 20 13s15-10 22-21c8-13-7-25-22-26Z" />
          <path d="M141 89c21-18 47 11 20 34-8 7-20 13-20 13s-15-10-22-21c-8-13 7-25 22-26Z" />
          <path d="M75 154h75" />
        </svg>
      </div>

      <div className="paper-wrap lex-dark-story-inner">
        <h2 className="paper-rev">
          One place for corpora, annotation, and AI workflows.
        </h2>

        <p className="paper-rev">
          LexData brings courses, research tools, NLP workflows, translation
          technology, and human-centered AI training into one language-data
          studio.
        </p>
      </div>
    </section>
  );
}

function LexDataManifestoSection() {
  return (
    <section className="lex-manifesto paper-page">
      <div className="paper-wrap">
        <p className="paper-rev">
          Plenty of AI tools are made for generic prompts, dashboards, and
          automation. <em>That is not us.</em>
        </p>

        <p className="paper-rev">
          LexData is here to help language researchers build corpora, evaluate
          translation, teach with evidence, and use AI with human judgment
          <span> in all its forms.</span>
        </p>

        <div className="lex-manifesto-doodle" aria-hidden="true">
          <svg viewBox="0 0 320 220">
            <path d="M65 166c38-44 89-63 152-56" />
            <path d="M205 87l32 23-36 11" />
            <path d="M55 176h83M74 156h60M94 136h38" />
            <path d="M205 151c26-32 54-35 80-8" />
            <path d="M239 111l20 17 22-33" />
            <path d="M37 66l11 11M48 66 37 77M283 55l11 11M294 55l-11 11" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function LexDataResearchToolsSection() {
  const cards = [
    {
      title: "Corpus design",
      body: "Collect, clean, segment, document, and prepare multilingual text data for research.",
    },
    {
      title: "NLP workflows",
      body: "Move from raw text to tokenization, annotation, embeddings, topic models, and evaluation.",
    },
    {
      title: "Translation technology",
      body: "Study machine translation, terminology, quality estimation, and human-AI revision.",
    },
  ];

  return (
    <section className="lex-made-section paper-page" data-paper-cover>
      <div className="lex-made-visual" aria-hidden="true">
        <div className="lex-made-screen">
          <div className="lex-made-sidebar">
            <span>My work</span>
            <span>Shared</span>
            <span>Settings</span>
          </div>

          <div className="lex-made-grid">
            <div>Corpus project</div>
            <div>Translation notes</div>
            <div>NLP pipeline</div>
            <div>Annotation plan</div>
          </div>
        </div>
      </div>

      <div className="paper-wrap">
        <div className="lex-made-paper">
          <h2 className="paper-rev">
            Made for <span>language researchers</span>
          </h2>

          <div className="lex-made-cards">
            {cards.map((card) => (
              <article key={card.title} className="paper-rev paper-turn">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
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
          <span>婵?2026 LexData</span>
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
        <LexDataDarkStorySection />
        <PreviousCasesShowcase />
        <LexDataManifestoSection />
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

        <LexDataResearchToolsSection />

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