import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import HomeHero from "@/components/HomeHero";
import HomeControlPanelButton from "@/components/HomeControlPanelButton";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import HomeHighlightedCourses from "@/components/HomeHighlightedCourses";
import HomeMediaShowcase from "@/components/HomeMediaShowcase";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import NlpAttractionSection from "@/components/NlpAttractionSection";
import MouCollaborationSection from "@/components/MouCollaborationSection";
import TeamShowcase from "@/components/TeamShowcase";

const featureCards = [
  {
    title: "Python and Data Skills",
    description:
      "Learn practical Python, data cleaning, visualization, automation, and applied research workflows.",
  },
  {
    title: "Corpus and NLP Research",
    description:
      "Build, clean, annotate, and analyze text corpora for language sciences and social science research.",
  },
  {
    title: "AI-assisted Research",
    description:
      "Use modern AI tools for literature review, coding support, analysis planning, and academic reporting.",
  },
];

const programCards = [
  {
    label: "Courses",
    title: "Structured learning paths",
    description:
      "Follow organized courses designed for students, researchers, teachers, and professionals.",
    href: "/courses",
    button: "Explore Courses",
  },
  {
    label: "Workshops",
    title: "Live practical training",
    description:
      "Join focused workshops on Python, AI, NLP, corpus research, academic writing, and digital methods.",
    href: "/workshops",
    button: "Explore Workshops",
  },
  {
    label: "Services",
    title: "Research support services",
    description:
      "Get support for data preparation, analysis workflows, training design, and research reporting.",
    href: "/services",
    button: "View Services",
  },
];

function MotionSection({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mlp-original-section" data-theme="dark">
      <div className="mlp-original-container">
        <div className="mlp-original-head">
          <p className="mlp-original-label" data-view>
            {label}
          </p>

          <h2 data-split-view>{title}</h2>

          {description ? (
            <p data-view data-scrub-y="-18">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mlp-original-panel" data-view>
          {children}
        </div>
      </div>
    </section>
  );
}

function UserManualSection() {
  return (
    <section className="mlp-original-section mlp-original-manual-section">
      <div className="mlp-original-container">
        <div className="mlp-original-manual-card" data-view data-tilt>
          <div>
            <p className="mlp-original-label">User Manual</p>

            <h2 data-split-view>New to LexData?</h2>

            <p>
              Read the general member guide to learn how to create an account,
              login, use your dashboard, check messages, and access workshops.
            </p>
          </div>

          <Link href="/member-manual" className="mlp-original-button">
            View User Manual
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function IntegratedHomePage() {
  const admin = createAdminClient();

  let canManageHomepage = false;
  let homepageVideos: any[] = [];

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

    const { data, error } = await homepageVideosQuery;

    if (!error) {
      homepageVideos = data ?? [];
    } else {
      console.error("homepage_videos loading error:", error.message);
    }
  } catch (error) {
    console.error("Homepage render error:", error);
    canManageHomepage = false;
    homepageVideos = [];
  }

  return (
    <>
      <div data-theme="light">
        <HomeHero />
      </div>

      <HomeControlPanelButton />

      <main className="mlp-original-root">
        <div className="mlp-original-marquee" data-marquee-velocity>
          <span>Corpus linguistics</span>
          <span>AI research</span>
          <span>NLP training</span>
          <span>Translation technology</span>
          <span>Academic writing</span>
          <span>Data science</span>
          <span>LexData</span>
        </div>

        <UserManualSection />

        <MotionSection
          label="Homepage showcase"
          title="Featured LexData announcements and highlights."
          description="This is the original admin-managed homepage showcase, now animated through Motion Layer Pro."
        >
          <DynamicHomeShowcase />
        </MotionSection>

        <MotionSection
          label="Highlighted courses"
          title="Featured courses from your course dashboard."
          description="This keeps the original dynamic course highlight section connected to your course data."
        >
          <HomeHighlightedCourses />
        </MotionSection>

        <MotionSection
          label="Video highlights"
          title="Homepage video showcase."
          description="This keeps your original dynamic video management section connected to homepage_videos."
        >
          <HomeMediaShowcase
            videos={homepageVideos}
            canManage={canManageHomepage}
          />
        </MotionSection>

        <MotionSection
          label="Latest workshop videos"
          title="Recent workshop previews and learning videos."
          description="This keeps the original latest workshop video component."
        >
          <LatestWorkshopVideos />
        </MotionSection>

        <MotionSection
          label="NLP attraction"
          title="Why language data matters."
          description="This keeps your original animated NLP attraction section."
        >
          <NlpAttractionSection />
        </MotionSection>

        <MotionSection
          label="Collaboration"
          title="Partnerships, MoUs, and academic cooperation."
          description="This keeps your original MoU and collaboration display."
        >
          <MouCollaborationSection />
        </MotionSection>

        <section className="mlp-original-section" data-theme="dark">
          <div className="mlp-original-container">
            <div className="mlp-original-head">
              <p className="mlp-original-label" data-view>
                LexData Offers
              </p>

              <h2 data-split-view>
                Practical research, AI, Python, and data skills for modern
                learners.
              </h2>

              <p data-view data-scrub-y="-18">
                LexData helps researchers, students, educators, and
                professionals learn applied digital research skills through
                courses, workshops, and hands-on training.
              </p>
            </div>

            <div className="mlp-original-card-grid">
              {featureCards.map((item) => (
                <article
                  key={item.title}
                  className="mlp-original-card"
                  data-view
                  data-tilt
                >
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="mlp-original-section mlp-original-program-pin"
          data-theme="dark"
          data-pin="260"
        >
          <div className="mlp-original-container">
            <div className="mlp-original-head">
              <p className="mlp-original-label" data-view>
                Programs
              </p>

              <h2 data-split-view>
                Learn through courses, workshops, and guided research support.
              </h2>
            </div>

            <div className="mlp-original-program-track" data-pin-track>
              {programCards.map((item) => (
                <article
                  key={item.title}
                  className="mlp-original-program-card"
                  data-tilt
                >
                  <p className="mlp-original-label">{item.label}</p>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>

                  <Link href={item.href} className="mlp-original-button">
                    {item.button}
                  </Link>
                </article>
              ))}
            </div>

            <div className="mlp-original-pin-bar">
              <b data-pin-fill />
            </div>
          </div>
        </section>

        <MotionSection
          label="LexData team"
          title="Dynamic team presentation."
          description="This keeps the original team data and profile links, now animated through Motion Layer Pro."
        >
          <TeamShowcase />
        </MotionSection>

        <section className="mlp-original-section" data-theme="dark">
          <div className="mlp-original-container">
            <div className="mlp-original-final-cta" data-view data-tilt>
              <p className="mlp-original-label">Start Learning</p>

              <h2 data-split-view>
                Build practical research, AI, Python, and data skills with
                LexData.
              </h2>

              <p>
                Explore our courses and workshops designed for language
                sciences, social sciences, education, translation, and digital
                research.
              </p>

              <div className="mlp-original-cta-row">
                <Link href="/courses" className="mlp-original-button">
                  Explore Courses
                </Link>

                <Link href="/workshops" className="mlp-original-button-outline">
                  Explore Workshops
                </Link>

                <Link href="/contact" className="mlp-original-button-outline">
                  Contact LexData
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}