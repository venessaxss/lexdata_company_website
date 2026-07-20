import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import HomeHero from "@/components/HomeHero";
import HomeControlPanelButton from "@/components/HomeControlPanelButton";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import HomeMediaShowcase from "@/components/HomeMediaShowcase";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import NlpAttractionSection from "@/components/NlpAttractionSection";
import MouCollaborationSection from "@/components/MouCollaborationSection";

import HomeV2LiveDashboard from "@/components/HomeV2LiveDashboard";
import HomeV2FeaturedCourses from "@/components/HomeV2FeaturedCourses";
import HomeV2TeamSlider from "@/components/HomeV2TeamSlider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function V2Section({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="v2-section">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-label">{label}</p>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        <div className="v2-panel">{children}</div>
      </div>
    </section>
  );
}

function ArabicLanguageSection() {
  return (
    <section className="v2-section">
      <div className="v2-container">
        <div className="v2-arabic-grid">
          <div className="v2-arabic-card">
            <p className="v2-label">Arabic language support</p>
            <h2>Arabic language, corpus, translation, and AI research.</h2>
            <p>
              LexData supports multilingual research and training, including
              Arabic language data, corpus linguistics, translation technology,
              discourse analysis, and AI-assisted academic workflows.
            </p>
          </div>

          <div className="v2-arabic-card">
            <p className="v2-label">Arabic section</p>

            <h3 dir="rtl">
              &#1583;&#1593;&#1605; &#1575;&#1604;&#1604;&#1594;&#1577; &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;
            </h3>

            <p dir="rtl">
              &#1578;&#1583;&#1593;&#1605; LexData &#1575;&#1604;&#1576;&#1581;&#1579; &#1575;&#1604;&#1604;&#1594;&#1608;&#1610; &#1608;&#1575;&#1604;&#1578;&#1585;&#1580;&#1605;&#1577; &#1608;&#1578;&#1581;&#1604;&#1610;&#1604; &#1575;&#1604;&#1606;&#1589;&#1608;&#1589;.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
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
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      canManageHomepage =
        profile?.role === "admin" || profile?.role === "manager";
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
    }
  } catch (error) {
    console.error("Homepage render error:", error);
    homepageVideos = [];
    canManageHomepage = false;
  }

  return (
    <>
      <HomeHero />
      <HomeControlPanelButton />

      <main className="v2-home-root">
        <section style={{ background: "red", color: "white", padding: 40, fontSize: 40 }}>
  V2 TEST SECTION IS RENDERING
</section>
        <HomeV2LiveDashboard />

        <HomeV2FeaturedCourses />

        <V2Section
          label="Homepage showcase"
          title="Featured LexData announcements and highlights."
          description="Current homepage highlights, selected public content, and featured platform updates."
        >
          <DynamicHomeShowcase />
        </V2Section>

        <V2Section
          label="Dynamic video showcase"
          title="Watch LexData in action."
          description="Selected videos from LexData training, NLP, AI research support, workshops, and collaboration programs."
        >
          <HomeMediaShowcase
            videos={homepageVideos}
            canManage={canManageHomepage}
          />
        </V2Section>

        <V2Section
          label="Latest workshop videos"
          title="Recent workshop previews and learning videos."
          description="Workshop previews, speaker videos, and learning highlights."
        >
          <LatestWorkshopVideos />
        </V2Section>

        <ArabicLanguageSection />

        <V2Section
          label="NLP attraction"
          title="Why language data matters."
          description="LexData connects language, corpus methods, AI, NLP, and data science for research and learning."
        >
          <NlpAttractionSection />
        </V2Section>

        <V2Section
          label="Collaboration"
          title="Partnerships, MoUs, and academic cooperation."
          description="Institutional cooperation, academic partnerships, and collaborative training programs."
        >
          <MouCollaborationSection />
        </V2Section>

        <HomeV2TeamSlider />

        <section className="v2-section">
          <div className="v2-container">
            <div className="v2-final-cta">
              <p className="v2-label">Start learning</p>

              <h2>
                Build practical research, AI, Python, and data skills with
                LexData.
              </h2>

              <p>
                Explore courses and workshops designed for language sciences,
                social sciences, education, translation, and digital research.
              </p>

              <div className="v2-cta-row">
                <Link href="/courses" className="v2-button-primary">
                  Explore courses
                </Link>

                <Link href="/workshops" className="v2-button-outline">
                  Explore workshops
                </Link>

                <Link href="/contact" className="v2-button-outline">
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