import Link from "next/link";
import PaperTypewriterLine from "@/components/PaperTypewriterLine";
import EllipsusNav from "@/components/EllipsusNav";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import DashboardBoardSlider from "@/components/DashboardBoardSlider";
import NoticeSpotlight from "@/components/NoticeSpotlight";
import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";
import { workshopNotices } from "@/content/workshopNotices";
import { getCurrentProfile, normalizeRole } from "@/lib/auth";

const typingPhrases = [
  "Research like a human.",
  "Translate with context.",
  "Build with data.",
  "Teach with evidence.",
];

const caseCards = [
  { label: "Case 01", title: "Corpus-based research training", body: "From raw text collection to cleaning, annotation, and analysis-ready datasets." },
  { label: "Case 02", title: "Multilingual translation workflow", body: "Human-in-the-loop terminology, translation review, and bilingual quality control." },
  { label: "Case 03", title: "AI research classroom", body: "Generative AI, Python, and NLP turned into practical workshops for humanities researchers." },
];

const floatingLetters = ["u", "n", "d", "k", "p", "d", "a", "z", "g", "m", "v", "e", "f", "w", "t", "c", "x", "y", "q", "s", "h", "r"];

function displayName(profile: any) {
  return profile?.full_name || profile?.name || profile?.display_name || profile?.email || "Member";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntegratedHomePage() {
  const profile = await getCurrentProfile();
  const role = normalizeRole(profile?.role);
  const isLoggedIn = Boolean(profile);
  const canManage = role === "admin" || role === "manager";

  return (
    <main className="ell-page lx-page">
      <EllipsusNav isLoggedIn={isLoggedIn} />

      <div className="lx-cover-sequence">
        <section className="lx-hero-sticky" aria-label="LexData introduction">
          <div className="lx-floating-letters" aria-hidden="true">
            {floatingLetters.map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ "--i": index } as React.CSSProperties}>{letter}</span>
            ))}
          </div>

          <svg className="lx-plane lx-plane-left" viewBox="0 0 140 120" aria-hidden="true">
            <path d="M12 66 124 18 78 106 58 72 12 66Z" />
            <path d="M58 72 124 18 70 62" />
          </svg>
          <svg className="lx-plane lx-plane-right" viewBox="0 0 140 120" aria-hidden="true">
            <path d="M20 20 124 64 78 70 58 112 48 72 20 20Z" />
            <path d="M48 72 124 64 58 58" />
          </svg>

          <div className="lx-hero-center">
            <h1><PaperTypewriterLine phrases={typingPhrases} /></h1>
            <p>LexData is a collaborative research and learning platform made for language, translation, AI, and data-driven creativity.</p>
            <div className="lx-hero-actions">
              <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="lx-join-btn">
                {isLoggedIn ? `Open ${displayName(profile)} dashboard` : "Join for free"}
              </Link>
              {canManage ? <Link href="/manager/registrations" className="lx-text-link">Review registrations</Link> : null}
            </div>
          </div>
        </section>

        <section className="lx-paper-cover" id="features">
          <div className="lx-wave-top" aria-hidden="true" />
          <div className="lx-paper-intro">
            <div className="lx-book-stack" aria-hidden="true"><span /><span /><span /></div>
            <h2>Made for <em>creative</em> researchers</h2>
          </div>

          <div className="lx-paper-copy">
            <p>
              Plenty of tools are made for memos, notes, and to-do lists.
              <strong className="lx-squiggle lx-squiggle-red"> That's not us.</strong>
            </p>
            <p>
              LexData is here to help you build research worlds, connect languages,
              raise better questions, and celebrate creativity in
              <strong className="lx-circle-green"> all its forms.</strong>
            </p>
          </div>

          <div className="lx-ai-stance">
            <div className="lx-robot" aria-hidden="true">
              <div className="lx-robot-head"><span>x</span><span>x</span></div>
              <div className="lx-robot-body">KEYS</div>
              <div className="lx-paper-bin">o o o</div>
            </div>
            <div className="lx-ai-copy">
              <p>
                We think researchers should be free to
                <span className="lx-underline-green"> express their creative vision</span> - away
                from opaque automation and the
                <span className="lx-circle-red"> prying eyes of AI.</span>
              </p>
              <small>Your content is <b>YOURS.</b> Human judgment stays in control.</small>
            </div>
          </div>
        </section>
      </div>

      <section className="lx-showcase-shell lx-dashboard-section">
        <div className="lx-dashboard-intro">
          <div className="lx-dashboard-doodle lx-dashboard-doodle-left" aria-hidden="true">
            <span className="lx-doodle-cup" />
            <span className="lx-doodle-books" />
          </div>
          <div className="lx-dashboard-copy">
            <p>One connected workspace</p>
            <h2>Dashboards, drafts, cases, and discussions</h2>
            <span>Keep the serious work organized without making the interface feel corporate. Move from research to review to feedback in one visual flow.</span>
          </div>
          <div className="lx-dashboard-doodle lx-dashboard-doodle-right" aria-hidden="true">
            <span className="lx-doodle-plant" />
            <span className="lx-doodle-pen" />
          </div>
        </div>
        <div className="lx-dashboard-stage lx-dashboard-stage-sliding">
          <DashboardBoardSlider labels={["Workspace", "Notifications", "Video"]}>
            <div className="lx-dashboard-main lx-dashboard-main-slide"><DynamicHomeShowcase /></div>
            <div className="lx-dashboard-main lx-dashboard-main-slide lx-dashboard-notice-slide"><NoticeSpotlight /></div>
            
          </DashboardBoardSlider>
        </div>
        <div className="lx-dashboard-caption">WRITE, REVIEW, SHARE, REPEAT</div>
      </section>

      <section className="lx-editorial-section" id="cases">
        <div className="lx-editorial-heading">
          <p>Selected work</p>
          <h2>Cases, methods, and research stories.</h2>
        </div>
        <div className="lx-case-grid">
          {caseCards.map((card) => (
            <article key={card.title} className="lx-case-card">
              <span>{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lx-notification-section" id="notifications">
        <div className="lx-notification-heading">
          <p>Stay in the loop</p>
          <h2>Notifications that feel like notes, not noise.</h2>
          <span>Workshop updates, registration activity, case changes, and team messages stay visible without interrupting the work.</span>
        </div>
        <div className="lx-notification-board">
          <div className="lx-notification-sketch" aria-hidden="true">
            <i className="lx-bell-line" />
            <i className="lx-note-line lx-note-line-one" />
            <i className="lx-note-line lx-note-line-two" />
          </div>
          <div className="lx-notification-live">
            <NoticeSpotlight />
          </div>
        </div>
      </section>
<WorkshopNoticeSlider notices={workshopNotices} />

      <section className="lx-final-cta">
        <p>One login. One dashboard.</p>
        <h2>Complete the whole research flow without breaking your rhythm.</h2>
        <div>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="lx-join-btn">{isLoggedIn ? "Open dashboard" : "Get started"}</Link>
          <a href="#workshops" className="lx-final-link">Explore upcoming workshops</a>
        </div>
      </section>
    </main>
  );
}