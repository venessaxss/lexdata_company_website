import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatEventDate, getLexDataEvents } from "@/lib/lexdata-events";

async function canManageContent() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.role === "admin" || profile?.role === "manager";
  } catch {
    return false;
  }
}

export default async function DynamicPosterSlider() {
  const [events, canManage] = await Promise.all([
    getLexDataEvents({
      activeOnly: true,
      featuredOnly: true,
      limit: 8,
    }),
    canManageContent(),
  ]);

  if (!events.length) {
    return null;
  }

  const slides = [...events, ...events];

  return (
    <section className="lex-poster-slider" id="poster-events">
      <div className="lex-poster-inner">
        <div className="lex-poster-head">
          <p>Latest posters and events</p>
          <h2>New workshops, updates, and featured LexData events.</h2>

          <div className="lex-poster-actions">
            <Link href="/blog/whats-new">View all updates</Link>

            {canManage ? (
              <Link href="/admin/events">Add new poster</Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lex-poster-marquee">
        <div className="lex-poster-track">
          {slides.map((event, index) => {
            const visual = event.poster_url || event.image_url;

            return (
              <Link
                key={`${event.id}-${index}`}
                href={`/blog/whats-new/${event.slug}`}
                className="lex-poster-card"
              >
                <div className="lex-poster-visual">
                  {visual ? (
                    <img src={visual} alt={event.title} />
                  ) : (
                    <div className="lex-poster-fallback">
                      <span>{event.category}</span>
                      <b>LexData</b>
                    </div>
                  )}

                  {event.video_url ? (
                    <span className="lex-poster-video-badge">Video</span>
                  ) : null}
                </div>

                <div className="lex-poster-copy">
                  <small>
                    {event.category} · {formatEventDate(event.event_date)}
                  </small>

                  <h3>{event.title}</h3>
                  <p>{event.excerpt}</p>

                  <strong>{event.cta_label || "Read more"} -&gt;</strong>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}