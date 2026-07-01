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

type Registration = {
  id: string;
  user_id?: string | null;
  workshop_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  created_at?: string | null;
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

  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";

  const workshopId = field(formData, "workshop_id");
  const workshopSlug = field(formData, "workshop_slug");
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");

  if (!workshopId || !workshopSlug) {
    redirect("/workshops?message=Missing workshop information");
  }

  if (!user) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "Please register or login as a member first"
      )}`
    );
  }

  if (!fullName || !email) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "Name and email are required"
      )}`
    );
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "You have already registered for this workshop"
      )}`
    );
  }

  const { error } = await supabase.from("workshop_registrations").insert({
    workshop_id: workshopId,
    workshop_slug: workshopSlug,
    session_id: null,
    user_id: user.id,
    full_name: fullName,
    email,
    phone: nullableField(formData, "phone"),
    organization: nullableField(formData, "organization"),
    message: nullableField(formData, "message"),
    status: "registered",
    payment_status: "pending",
    payment_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(error.message)}`
    );
  }

  await supabase.from("user_messages").insert({
    user_id: user.id,
    title: "Workshop registration received",
    body:
      "Your workshop registration has been received. Our team will review it and send you the next payment step here. After payment is confirmed, the full workshop session links will be unlocked.",
    link_url: `/workshops/${workshopSlug}`,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  revalidatePath(`/workshops/${workshopSlug}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");

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
    return "Contact us";
  }

  return `${price} ${workshop.currency || "USD"}`;
}

function hasPaidAccess(registration: Registration | null) {
  if (!registration) return false;

  return (
    registration.payment_status === "confirmed" ||
    registration.payment_status === "paid" ||
    registration.status === "approved" ||
    registration.status === "confirmed" ||
    registration.status === "paid"
  );
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  let registration: Registration | null = null;

  if (user) {
    const { data: registrationData } = await supabase
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationData as Registration | null;
  }

  const paidAccess = isAdmin || hasPaidAccess(registration);
  const canSeeWorkshopCost = isAdmin || Boolean(registration);

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

            <div
              className={
                canSeeWorkshopCost
                  ? "mt-8 grid gap-4 md:grid-cols-4"
                  : "mt-8 grid gap-4 md:grid-cols-3"
              }
            >
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

              {canSeeWorkshopCost ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Cost
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {formatPrice(workshop)}
                  </p>
                </div>
              ) : null}
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
                Session arrangement
              </h2>

              {!user ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  Please register or login as a member first. After registration
                  and payment confirmation, full session links will be unlocked.
                </div>
              ) : registration && !paidAccess ? (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
                  You have registered for this workshop. Please check your
                  message box for the payment step. Session links will be
                  unlocked after payment is confirmed.

                  <div className="mt-4">
                    <Link
                      href="/dashboard/messages"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Open message box
                    </Link>
                  </div>
                </div>
              ) : paidAccess ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                  Payment confirmed. Full session links are unlocked.
                </div>
              ) : null}

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

                        {paidAccess && session.media_url ? (
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

                        {paidAccess ? (
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
                        ) : (
                          <div className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                            Session links are locked until registration and
                            payment confirmation.
                          </div>
                        )}
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
      Registration submitted successfully. Check your message box for the next
      payment step.
    </div>
  ) : null}

  {message ? (
    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
      {message}
    </div>
  ) : null}

  {isAdmin ? (
    <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
      <p className="font-semibold text-purple-800">
        Admin access enabled.
      </p>

      <p className="mt-2 text-sm leading-6 text-purple-700">
        You are viewing this workshop as an admin. Registration, payment, cost,
        session links, materials, recordings, and videos are unlocked for this
        account.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/registrations"
          className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
        >
          Manage registrations
        </Link>

        <Link
          href="/admin/workshops"
          className="rounded-xl border border-purple-300 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100"
        >
          Manage workshops
        </Link>
      </div>
    </div>
  ) : !user ? (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-semibold text-amber-800">
        Please register as a website member first.
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-700">
        Guest users cannot see workshop cost or register directly. After you
        create an account and login, you can submit your workshop registration.
        Cost and payment details are shown only after registration.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/signup?redirect=/workshops/${slug}`}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          Create account
        </Link>

        <Link
          href={`/login?redirect=/workshops/${slug}`}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
        >
          Login
        </Link>
      </div>
    </div>
  ) : registration ? (
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="font-semibold text-blue-800">
        You have already registered for this workshop.
      </p>

      <p className="mt-2 text-sm text-blue-700">
        Registration status: {registration.status || "registered"}
      </p>

      <p className="mt-1 text-sm text-blue-700">
        Payment status: {registration.payment_status || "pending"}
      </p>

      <p className="mt-1 text-sm font-semibold text-blue-800">
        Workshop cost: {formatPrice(workshop)}
      </p>

      {registration.payment_link ? (
        <a
          href={registration.payment_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
        >
          Open payment link
        </a>
      ) : (
        <Link
          href="/dashboard/messages"
          className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
        >
          Check message box
        </Link>
      )}
    </div>
  ) : (
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
        defaultValue={user.email ?? ""}
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
  )}

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

    {paidAccess && materialUrl ? (
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