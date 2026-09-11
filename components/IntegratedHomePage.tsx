import Link from "next/link";
import PaperTypewriterLine from "@/components/PaperTypewriterLine";
import DynamicHomeShowcase from "@/components/DynamicHomeShowcase";
import DynamicDoodleBand from "@/components/DynamicDoodleBand";
import NoticeSpotlight from "@/components/NoticeSpotlight";
import BubblingCaseGrid from "@/components/BubblingCaseGrid";
import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";
import InternHiringSlider from "@/components/InternHiringSlider";
import DynamicArtisticStatement from "@/components/DynamicArtisticStatement";
import { getPublicWorkshopNotices } from "@/lib/workshop-notices";
import { getCurrentProfile, normalizeRole } from "@/lib/auth";

const typingPhrases = [
  "Research like a human.",
  "Translate with context.",
  "Build with data.",
  "Teach with evidence.",
];

const floatingLetters = ["u", "n", "d", "k", "p", "d", "a", "z", "g", "m", "v", "e", "f", "w", "t", "c", "x", "y", "q", "s", "h", "r"].map((letter, index) => ({
  letter,
  x: 5 + ((index * 37 + 11) % 89),
  y: 5 + ((index * 53 + 7) % 84),
  driftX: -13 + ((index * 17) % 27),
  driftY: -11 - ((index * 7) % 19),
  size: 13 + ((index * 11) % 15),
  duration: 10 + ((index * 13) % 9),
  delay: -((index * 7) % 12),
  rotation: -8 + ((index * 5) % 17),
}));

function displayName(profile: any) {
  return profile?.full_name || profile?.name || profile?.display_name || profile?.email || "Member";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IntegratedHomePage() {
  const workshopNotices = await getPublicWorkshopNotices();
  const profile = await getCurrentProfile();
  const role = normalizeRole(profile?.role);
  const isLoggedIn = Boolean(profile);
  const canManage = role === "admin" || role === "manager";

  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "manager"
        ? "/manager"
        : role === "speaker"
          ? "/speaker"
          : "/dashboard";

  const registrationsHref =
    role === "admin"
      ? "/admin/registrations"
      : "/manager/registrations";

  return (
    <main className="ell-page lx-page">
      

      <div className="lx-cover-sequence">
        <section className="lx-hero-sticky" aria-label="LexData introduction">
          <div className="lx-floating-letters" aria-hidden="true">
            {floatingLetters.map((item, index) => (
              <span
                key={`${item.letter}-${index}`}
                style={{
                  "--x": `${item.x}%`,
                  "--y": `${item.y}%`,
                  "--drift-x": `${item.driftX}px`,
                  "--drift-y": `${item.driftY}px`,
                  "--letter-size": `${item.size}px`,
                  "--letter-duration": `${item.duration}s`,
                  "--letter-delay": `${item.delay}s`,
                  "--letter-rotation": `${item.rotation}deg`,
                } as React.CSSProperties}
              >
                {item.letter}
              </span>
            ))}
          </div>

          <svg className="lx-plane lx-plane-left" viewBox="0 0 140 120" aria-hidden="true">
            <path className="lx-plane-outline" d="M12 66C42 54 84 34 124 18 108 51 91 82 78 106L58 72 12 66Z" />
            <path className="lx-plane-fold" d="M58 72C80 56 101 37 124 18 103 37 87 53 70 62" />
            <path className="lx-plane-echo" d="M7 72c18 2 29 7 39 17" />
          </svg>
          <svg className="lx-plane lx-plane-right" viewBox="0 0 140 120" aria-hidden="true">
            <path className="lx-plane-outline" d="M20 20C52 34 88 51 124 64L78 70 58 112 48 72 20 20Z" />
            <path className="lx-plane-fold" d="M48 72C77 68 99 65 124 64 99 61 79 59 58 58" />
            <path className="lx-plane-echo" d="M106 84c11 6 18 13 23 23" />
          </svg>

          <div className="lx-hero-center lx-hero-arrive">
            <h1><PaperTypewriterLine phrases={typingPhrases} /></h1>
            <p>LexData is a collaborative research and learning platform made for language, translation, AI, and data-driven creativity.</p>
            <div className="lx-hero-actions">
              <Link href={isLoggedIn ? dashboardHref : "/signup"} className="lx-join-btn">
                {isLoggedIn ? `Open ${displayName(profile)} dashboard` : "Join for free"}
              </Link>
              {canManage ? <Link href={registrationsHref} className="lx-text-link">Review registrations</Link> : null}
            </div>
          </div>
        </section>

        <section className="lx-paper-cover" id="features">
          <div className="lx-wave-top" aria-hidden="true" />
          <div className="lx-paper-intro rev">
            <div className="lx-book-stack" aria-hidden="true"><span /><span /><span /></div>
            <h2>Made for <em>creative</em> researchers</h2>
          </div>

          <div className="lx-paper-copy">
            <p className="rev">
              Plenty of tools are made for memos, notes, and to-do lists.
              <strong className="lx-squiggle lx-squiggle-red"> That's not us.</strong>
            </p>
            <p className="rev" style={{ "--d": ".08s" } as React.CSSProperties}>
              LexData is here to help you build research worlds, connect languages,
              raise better questions, and celebrate creativity in
              <strong className="lx-circle-green"> all its forms.</strong>
            </p>
          </div>
          <DynamicArtisticStatement />
        </section>
      </div>

      <section className="lx-showcase-shell">
        <DynamicDoodleBand />
        <DynamicHomeShowcase />
      </section>

      <section className="lx-editorial-section" id="cases">
        <div className="lx-editorial-heading rev">
          <p>Selected work</p>
          <h2>Cases, methods, and research stories.</h2>
        </div>
        <BubblingCaseGrid />
      </section>

      <section className="lx-notification-section" id="notifications">
        <div className="lx-notification-heading rev">
          <p>Stay in the loop</p>
          <h2>Notifications that feel like notes, not noise.</h2>
          <span>Workshop updates, registration activity, case changes, and team messages stay visible without interrupting the work.</span>
        </div>
        <div className="lx-notification-board rev" style={{ "--d": ".08s" } as React.CSSProperties}>
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
      <InternHiringSlider />

      <section className="lx-final-cta">
        <p>One login. One dashboard.</p>
        <h2 className="rev">Complete the whole research flow without breaking your rhythm.</h2>
        <div>
          <Link href={isLoggedIn ? dashboardHref : "/signup"} className="lx-join-btn">{isLoggedIn ? "Open dashboard" : "Get started"}</Link>
          <a href="#workshops" className="lx-final-link">Explore upcoming workshops</a>
        </div>
      </section>
    </main>
  );
}
