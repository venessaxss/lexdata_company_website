import Link from "next/link";
import EllipsusNav from "@/components/EllipsusNav";
import { getAllPartners } from "@/lib/partners";
import "./partners.css";

export const metadata = {
  title: "Our Partners | LexData",
  description: "Institutions and organizations LexData collaborates with.",
};

export default function PartnersPage() {
  const partners = getAllPartners();
  const workshopCount = partners.filter((p) => p.workshop).length;

  return (
    <>
      <EllipsusNav />
      <main className="partners-page">
        <section className="partners-hero">
          <div className="partners-wrap">
            <span className="partners-eyebrow">About LexData</span>
            <h1>Our Partners</h1>
            <p className="partners-lead">
              Institutions and organizations we collaborate with on workshops
              and academic initiatives.
            </p>
            <ul className="partners-stats">
              <li>
                <strong>{partners.length}</strong>
                <span>{partners.length === 1 ? "Partner" : "Partners"}</span>
              </li>
              <li>
                <strong>{workshopCount}</strong>
                <span>
                  Joint {workshopCount === 1 ? "workshop" : "workshops"}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="partners-wrap partners-list">
          {partners.map((p) => (
            <article key={p.slug} className="partner-card">
              <div className="partner-media">
                {p.image ? (
                  <img src={p.image} alt={p.name} loading="lazy" />
                ) : (
                  <div className="partner-media-fallback">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="partner-body">
                {p.type ? <span className="partner-badge">{p.type}</span> : null}
                {p.logo ? (
                  <img className="partner-logo" src={p.logo} alt="" />
                ) : null}
                <h2>{p.name}</h2>
                <p className="partner-desc">{p.description}</p>

                {p.workshop ? (
                  <Link href={p.workshop.href} className="partner-workshop">
                    <span className="partner-workshop-label">Joint workshop</span>
                    <span className="partner-workshop-title">
                      {p.workshop.title}
                    </span>
                    <span className="partner-workshop-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ) : null}

                {p.website ? (
                  <div className="partner-actions">
                    <a
                      className="partner-btn partner-btn-primary"
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit website ↗
                    </a>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="partners-wrap">
          <div className="partners-cta">
            <div>
              <h2>Interested in partnering with us?</h2>
              <p>Get in touch and let&apos;s explore how we can work together.</p>
            </div>
            <Link href="/contact" className="partner-btn partner-btn-light">
              Get in touch
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
