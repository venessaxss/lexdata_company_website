import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeMediaItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  button_text?: string | null;
  button_href?: string | null;
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

function isDirectVideo(url?: string | null) {
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".mp4") ||
    lowered.includes(".webm") ||
    lowered.includes(".mov") ||
    lowered.includes(".m4v")
  );
}

function isImage(url?: string | null, mediaType?: string | null) {
  if (mediaType === "image") return true;
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".jpg") ||
    lowered.includes(".jpeg") ||
    lowered.includes(".png") ||
    lowered.includes(".webp") ||
    lowered.includes(".gif") ||
    lowered.includes("supabase")
  );
}

function MediaPreview({ item }: { item: HomeMediaItem }) {
  const mediaUrl = item.media_url;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  if (!mediaUrl) {
    return (
      <div className="flex h-64 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
        No media
      </div>
    );
  }

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={item.title || "Homepage media"}
        className="h-64 w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (item.media_type === "video" || isDirectVideo(mediaUrl)) {
    return (
      <video
        src={mediaUrl}
        controls
        playsInline
        className="h-64 w-full object-cover"
      />
    );
  }

  if (isImage(mediaUrl, item.media_type)) {
    return (
      <img
        src={mediaUrl}
        alt={item.title || "Homepage media"}
        className="h-64 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-64 items-center justify-center bg-slate-950 p-6 text-center">
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
      >
        Open media
      </a>
    </div>
  );
}

export default async function HomeMediaShowcase() {
  noStore();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("home_media_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("HomeMediaShowcase error:", error.message);
    return null;
  }

  const items = (data ?? []) as HomeMediaItem[];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              LexData Media
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Training, research, and learning highlights
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore LexData training sessions, research support, and online
              learning programs.
            </p>
          </div>

          <Link
            href="/workshops"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Explore workshops
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <MediaPreview item={item} />

              <div className="p-7">
                <h3 className="text-2xl font-black text-slate-950">
                  {item.title}
                </h3>

                {item.description ? (
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    {item.description}
                  </p>
                ) : null}

                {item.button_href ? (
                  <Link
                    href={item.button_href}
                    className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    {item.button_text || "Learn more"}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}