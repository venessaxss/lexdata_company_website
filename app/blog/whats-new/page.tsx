import Link from "next/link";
import {
  formatEventDate,
  formatEventMonth,
  getLexDataEvents,
} from "@/lib/lexdata-events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LexDataWhatsNewPage() {
  const events = await getLexDataEvents({
    activeOnly: true,
    limit: 100,
  });

  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const month = formatEventMonth(event.event_date);
    acc[month] = acc[month] || [];
    acc[month].push(event);
    return acc;
  }, {});

  return (
    <main className="lex-whats-new-page">
      <section className="lex-whats-new-hero">
        <Link href="/" className="lex-whats-new-home">
          Homepage
        </Link>

        <p>LexData updates</p>
        <h1>What's new</h1>
        <span>
          Workshops, events, posters, videos, platform updates, and research
          announcements from the LexData studio.
        </span>
      </section>

      <section className="lex-whats-new-list">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="lex-whats-new-month">
            <h2>{month}</h2>

            <div className="lex-whats-new-cards">
              {items.map((event, index) => {
                const visual = event.poster_url || event.image_url;

                return (
                  <article
                    key={event.id}
                    className={`lex-whats-new-card ${
                      visual ? "has-visual" : ""
                    }`}
                  >
                    {visual ? (
                      <Link
                        href={`/blog/whats-new/${event.slug}`}
                        className="lex-whats-new-visual"
                      >
                        <img src={visual} alt={event.title} />
                      </Link>
                    ) : (
                      <Link
                        href={`/blog/whats-new/${event.slug}`}
                        className="lex-whats-new-visual lex-whats-new-paper"
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <b>{event.category}</b>
                      </Link>
                    )}

                    <div className="lex-whats-new-copy">
                      <Link href={`/blog/whats-new/${event.slug}`}>
                        Read more
                      </Link>

                      <time>{formatEventDate(event.event_date)}</time>

                      <h3>{event.title}</h3>

                      <p>{event.excerpt}</p>

                      <small>
                        By: {event.author} · {event.category}
                        {event.video_url ? " · Video" : ""}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="lex-whats-new-subscribe">
        <h2>Stay in the LexData loop.</h2>
        <p>
          Follow new workshops, AI/NLP events, research notes, and language-data
          releases.
        </p>

        <Link href="/contact">Contact us</Link>
      </section>
    </main>
  );
}