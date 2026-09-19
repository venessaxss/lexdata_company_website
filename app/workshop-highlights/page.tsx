import WorkshopHighlightsYears from "@/components/WorkshopHighlightsYears";
import { getWorkshopYearGroups } from "@/lib/workshop-highlights";

export default function WorkshopHighlightsPage() {
  const groups = getWorkshopYearGroups();

  return (
    <main className="wh-page wh-index">
      <section className="wh-hero">
        <div className="wh-hero-inner">
          <svg className="wh-doodle" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M4 28 L60 6 L42 58 L30 38 Z" />
            <path d="M30 38 L60 6" />
            <path d="M30 38 L28 52 L36 44" />
          </svg>
          <p className="wh-eyebrow">LexData Workshop Highlights</p>
          <h1>
            Real sessions, real research.
            <br />
            <em>See what happened in the room.</em>
          </h1>
          <p className="wh-hero-dek">
            Photos, lecture material, and session breakdowns from workshops run
            for researchers, students, and practitioners — a look back at the
            people and ideas behind every session.
          </p>

          <div className="wh-hero-actions">
            <a className="wh-btn wh-btn-primary" href="#browse-by-year">
              Browse by year
            </a>
            <a
              className="wh-btn wh-btn-ghost"
              href="https://www.instagram.com/lexdata.techhub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
              </svg>
              Follow @lexdata.techhub
            </a>
          </div>
        </div>
      </section>

      <WorkshopHighlightsYears groups={groups} />
    </main>
  );
}