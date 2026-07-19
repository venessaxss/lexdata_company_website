import Link from "next/link";
import { formatEventDate, getLexDataEvents } from "@/lib/lexdata-events";

export default async function LatestEventsHomeSection() {
  const events = await getLexDataEvents({
    activeOnly: true,
    featuredOnly: true,
    limit: 4,
  });

  if (!events.length) {
    return null;
  }

  const primary = events[0];
  const secondary = events.slice(1);
  const visual = primary.poster_url || primary.image_url;

  return (
    <section className="lex-home-events paper-page" id="latest-events">
      <div className="paper-wrap">
        <div className="lex-home-events-head paper-rev">
          <p>What's new</p>
          <h2>New events, workshops, and LexData updates.</h2>
          <Link href="/blog/whats-new">View all updates -&gt;</Link>
        </div>

        <div className="lex-home-events-grid">
          <Link
            href={`/blog/whats-new/${primary.slug}`}
            className="lex-home-event-primary paper-rev paper-turn"
          >
            {visual ? (
              <img src={visual} alt={primary.title} />
            ) : (
              <div className="lex-home-event-fallback">
                <span>{primary.category}</span>
                <b>LexData</b>
              </div>
            )}

            <div>
              <small>{formatEventDate(primary.event_date)}</small>
              <h3>{primary.title}</h3>
              <p>{primary.excerpt}</p>
              <strong>{primary.cta_label || "Read more"} -&gt;</strong>
            </div>
          </Link>

          <div className="lex-home-events-stack">
            {secondary.map((event) => (
              <Link
                key={event.id}
                href={`/blog/whats-new/${event.slug}`}
                className="lex-home-event-small paper-rev paper-turn"
              >
                <small>{event.category} · {formatEventDate(event.event_date)}</small>
                <h3>{event.title}</h3>
                <p>{event.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}