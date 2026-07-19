import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatEventDate,
  getLexDataEventBySlug,
  getYouTubeEmbedUrl,
} from "@/lib/lexdata-events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LexDataEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getLexDataEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const visual = event.poster_url || event.image_url;
  const embedUrl = getYouTubeEmbedUrl(event.video_url);

  return (
    <main className="lex-event-detail">
      <section className="lex-event-detail-hero">
        <Link href="/blog/whats-new">Back to what's new</Link>

        <p>{event.category}</p>
        <time>{formatEventDate(event.event_date)}</time>
        <h1>{event.title}</h1>
        <span>By: {event.author}</span>
      </section>

      {visual ? (
        <section className="lex-event-detail-media">
          <img src={visual} alt={event.title} />
        </section>
      ) : null}

      {embedUrl ? (
        <section className="lex-event-detail-video">
          <iframe
            src={embedUrl}
            title={event.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </section>
      ) : null}

      <article className="lex-event-detail-body">
        <p className="lex-event-detail-excerpt">{event.excerpt}</p>

        {event.content
          .split(/\n+/)
          .filter(Boolean)
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

        {event.cta_href ? (
          <Link href={event.cta_href}>{event.cta_label || "Read more"} -&gt;</Link>
        ) : null}
      </article>
    </main>
  );
}