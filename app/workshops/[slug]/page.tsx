import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
  language?: string | null;
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  instructor?: string | null;
  speaker?: string | null;
  format?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  duration?: string | null;
  price?: number | null;
  currency?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  material_url?: string | null;
  materials_url?: string | null;
  resource_url?: string | null;
  file_url?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
};

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

async function registerForWorkshop(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const workshopId = field(formData, "workshop_id");
  const workshopSlug = field(formData, "workshop_slug");
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");

  if (!workshopId || !workshopSlug) {
    redirect("/workshops?message=Missing workshop information");
  }

  if (!fullName || !email) {
    redirect(`/workshops/${workshopSlug}?message=Name and email are required`);
  }

  const { error } = await supabase.from("workshop_registrations").insert({
    workshop_id: workshopId,
    workshop_slug: workshopSlug,
    full_name: fullName,
    email,
    phone: nullableField(formData, "phone"),
    organization: nullableField(formData, "organization"),
    message: nullableField(formData, "message"),
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/workshops/${workshopSlug}`);
  redirect(`/workshops/${workshopSlug}?registered=1`);
}

function getYouTubeEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        const videoId = parsedUrl.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return url;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsedUrl.pathname.replace("/", "").split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getCoverImage(workshop: Workshop) {
  return (
    workshop.image_url ||
    workshop.cover_url ||
    workshop.thumbnail_url ||
    null
  );
}

function getMaterialUrl(workshop: Workshop) {
  return (
    workshop.material_url ||
    workshop.materials_url ||
    workshop.resource_url ||
    workshop.file_url ||
    null
  );
}

function getWorkshopDescription(workshop: Workshop) {
  return (
    workshop.description ||
    workshop.short_description ||
    workshop.summary ||
    "Workshop details will be updated soon."
  );
}

function formatPrice(workshop: Workshop) {
  const price = Number(workshop.price ?? 0);

  if (!price) {
    return "Free / Contact us";
  }

  return `${price} ${workshop.currency || "USD"}`;
}

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; registered?: string }>;
}) {
  noStore();

  const { slug } = await params;
  const { message, registered } = await searchParams;

  const supabase = await createClient();

  const { data: workshopData, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

  const published =
    workshop.is_published !== false && workshop.is_active !== false;

  if (!published) {
    notFound();
  }

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const sessions = (sessionsData ?? []) as WorkshopSession[];

  const coverImage = getCoverImage(workshop);
  const materialUrl = getMaterialUrl(workshop);
  const description = getWorkshopDescription(workshop);

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/workshops"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {coverImage ? (
            <img
              src={coverImage}
              alt={workshop.title ?? "Workshop cover"}
              className="h-[360px] w-full object-cover"
            />
          ) : (
            <div className="h-[360px] w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100" />
          )}

          <div className="p-8 md:p-10">
            <p className="text-sm font-semibold text-slate-500">
              {workshop.level || "Beginner"} · {workshop.language || "English"}
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              {workshop.title}
            </h1>

            {workshop.short_description || workshop.summary ? (
              <p className="mt-6 max-w-4xl text-xl leading-9 text-slate-600">
                {workshop.short_description || workshop.summary}
              </p>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Format
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.format || "Online"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.start_date || workshop.date || "TBA"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Duration
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.duration || "TBA"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Price
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {formatPrice(workshop)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-black text-slate-950">
                Workshop introduction
              </h2>

              <div className="mt-6 whitespace-pre-wrap text-lg leading-9 text-slate-700">
                {description}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-black text-slate-950">
                Available sessions
              </h2>

              {sessions.length === 0 ? (
                <p className="mt-6 text-lg text-slate-600">
                  No upcoming sessions yet.
                </p>
              ) : (
                <div className="mt-6 space-y-5">
                  {sessions.map((session) => {
                    const youtubeEmbedUrl = getYouTubeEmbedUrl(
                      session.media_url
                    );

                    return (
                      <article
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <h3 className="text-xl font-black text-slate-950">
                          {session.title || "Workshop Session"}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                          {session.session_date ? (
                            <span>Date: {session.session_date}</span>
                          ) : null}

                          {session.start_time ? (
                            <span>Start: {session.start_time}</span>
                          ) : null}

                          {session.end_time ? (
                            <span>End: {session.end_time}</span>
                          ) : null}

                          {session.location ? (
                            <span>Location: {session.location}</span>
                          ) : null}
                        </div>

                        {session.media_url ? (
                          <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950">
                            {session.media_type === "video" ? (
                              <video
                                src={session.media_url}
                                controls
                                playsInline
                                className="aspect-video w-full object-cover"
                              />
                            ) : youtubeEmbedUrl ? (
                              <iframe
                                src={youtubeEmbedUrl}
                                title={session.title || "Workshop video"}
                                className="aspect-video w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            ) : (
                              <div className="flex aspect-video items-center justify-center p-6 text-center text-white">
                                <a
                                  href={session.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100"
                                >
                                  Open session video
                                </a>
                              </div>
                            )}
                          </div>
                        ) : null}

                        <div className="mt-5 flex flex-wrap gap-3">
                          {session.meeting_url ? (
                            <a
                              href={session.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                            >
                              Join session
                            </a>
                          ) : null}

                          {session.recording_url ? (
                            <a
                              href={session.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                            >
                              Recording
                            </a>
                          ) : null}

                          {session.material_url ? (
                            <a
                              href={session.material_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                            >
                              Materials
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Register for this workshop
            </h2>

            {registered ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Registration submitted successfully. We will contact you soon.
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {message}
              </div>
            ) : null}

            <form action={registerForWorkshop} className="mt-6 space-y-4">
              <input type="hidden" name="workshop_id" value={workshop.id} />
              <input type="hidden" name="workshop_slug" value={slug} />

              <input
                name="full_name"
                required
                placeholder="Full name"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                name="phone"
                placeholder="Phone / WhatsApp / WeChat"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                name="organization"
                placeholder="University / company"
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                name="message"
                rows={4}
                placeholder="Message or questions"
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
              >
                Submit Registration
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {workshop.instructor || workshop.speaker ? (
                <p>
                  <strong>Instructor:</strong>{" "}
                  {workshop.instructor || workshop.speaker}
                </p>
              ) : null}

              {workshop.location ? (
                <p className="mt-2">
                  <strong>Location:</strong> {workshop.location}
                </p>
              ) : null}

              {materialUrl ? (
                <a
                  href={materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex font-bold text-blue-700 hover:underline"
                >
                  View workshop material
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}