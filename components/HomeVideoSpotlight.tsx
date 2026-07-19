import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type VideoSlide = {
  id: string;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  primary_button_text?: string | null;
  primary_button_href?: string | null;
  secondary_button_text?: string | null;
  secondary_button_href?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

function getYouTubeVideoId(url?: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || null;
      }
    }

    if (host === "youtu.be") {
      return parsedUrl.pathname.replace("/", "").split("?")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url?: string | null) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1`;
}

export default async function HomeVideoSpotlight() {
  noStore();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_hero_slides")
    .select("*")
    .eq("is_active", true)
    .eq("media_type", "video")
    .not("media_url", "is", null)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("HomeVideoSpotlight error:", error.message);
    return null;
  }

  const slide = (data?.[0] ?? null) as VideoSlide | null;

  if (!slide?.media_url) {
    return null;
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(slide.media_url);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
            Featured Video
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {slide.title || "Watch our latest workshop introduction"}
          </h2>

          {slide.subtitle ? (
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {slide.subtitle}
            </p>
          ) : (
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Learn more about LexData workshops, upcoming sessions, and
              practical research training through our latest video preview.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-2xl">
          <div className="relative aspect-video bg-slate-950">
            {youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                title={slide.title || "Featured video"}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
  src={slide.media_url}
  className="absolute inset-0 h-full w-full object-cover"
  playsInline
  controls
/>
            )}
          </div>

          <div className="flex flex-col justify-between gap-5 bg-slate-950 p-6 text-white md:flex-row md:items-center">
            <div>
              {slide.badge ? (
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
                  {slide.badge}
                </p>
              ) : null}

              <h3 className="mt-2 text-2xl font-black">
                {slide.title || "Featured workshop video"}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {slide.primary_button_text && slide.primary_button_href ? (
                <Link
                  href={slide.primary_button_href}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
                >
                  {slide.primary_button_text}
                </Link>
              ) : null}

              {slide.secondary_button_text && slide.secondary_button_href ? (
                <Link
                  href={slide.secondary_button_href}
                  className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  {slide.secondary_button_text}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}