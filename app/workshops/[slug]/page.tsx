import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  short_description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  level?: string | null;
  starts_at?: string | null;
  created_at?: string | null;
};

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  speaker_email?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type WorkshopSubsession = {
  id: string;
  session_id?: string | null;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  speaker_email?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type Registration = {
  id: string;
  user_id?: string | null;
  workshop_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  payment_note?: string | null;
  created_at?: string | null;
};

type Profile = {
  id?: string | null;
  full_name?: string | null;
  role?: string | null;
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeRole(role?: string | null) {
  if (!role) return "member";

  if (role === "student") {
    return "member";
  }

  return role;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatWorkshopPrice(workshop: Workshop) {
  const rawPrice = workshop.price ?? 0;
  const price = Number(rawPrice);
  const currency = workshop.currency || "USD";

  if (!Number.isFinite(price) || price <= 0) {
    return "Free / Not set";
  }

  return `${currency} ${price}`;
}

function hasConfirmedWorkshopAccess(registration: Registration | null) {
  if (!registration) {
    return false;
  }

  const paymentStatus = registration.payment_status?.toLowerCase() || "";
  const registrationStatus = registration.status?.toLowerCase() || "";

  return (
    paymentStatus === "confirmed" ||
    paymentStatus === "paid" ||
    paymentStatus === "waived" ||
    paymentStatus === "not_required" ||
    registrationStatus === "confirmed"
  );
}

function isExternalVideo(mediaType?: string | null, mediaUrl?: string | null) {
  if (!mediaUrl) return false;

  const type = mediaType?.toLowerCase() || "";

  return (
    type === "external_video" ||
    type === "youtube" ||
    mediaUrl.includes("youtube.com") ||
    mediaUrl.includes("youtu.be") ||
    mediaUrl.includes("jianying") ||
    mediaUrl.includes("capcut")
  );
}

function getYouTubeEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }

      if (parsed.pathname.includes("/embed/")) {
        return url;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function registerForWorkshop(formData: FormData) {
  "use server";

  const workshopId = field(formData, "workshop_id");
  const slug = field(formData, "slug");

  if (!workshopId || !slug) {
    redirect("/workshops?message=Missing workshop information");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/workshops/${slug}`);
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: existingRegistration } = await admin
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRegistration) {
    redirect(`/workshops/${slug}?message=You have already registered for this workshop`);
  }

  const { error } = await admin.from("workshop_registrations").insert({
    workshop_id: workshopId,
    user_id: user.id,
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email ||
      "Member",
    email: user.email,
    status: "pending",
    payment_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/workshops/${slug}?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/workshops/${slug}?message=Registration submitted. Please check your dashboard and message box for updates.`
  );
}

function ResourceButtons({
  meetingUrl,
  recordingUrl,
  materialUrl,
}: {
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  materialUrl?: string | null;
}) {
  if (!meetingUrl && !recordingUrl && !materialUrl) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {meetingUrl ? (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          Join session
        </a>
      ) : null}

      {recordingUrl ? (
        <a
          href={recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Recording
        </a>
      ) : null}

      {materialUrl ? (
        <a
          href={materialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Materials
        </a>
      ) : null}
    </div>
  );
}

function MediaBlock({
  mediaType,
  mediaUrl,
}: {
  mediaType?: string | null;
  mediaUrl?: string | null;
}) {
  if (!mediaUrl) {
    return null;
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  if (youtubeEmbedUrl) {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          src={youtubeEmbedUrl}
          title="Workshop video"
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <video src={mediaUrl} controls className="w-full" />
      </div>
    );
  }

  if (isExternalVideo(mediaType, mediaUrl)) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
      >
        Open video link
      </a>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
    >
      Open media
    </a>
  );
}

export default async function WorkshopSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  const { slug } = await params;
  const { message } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData as Profile | null;
  }

  const rawRole = profile?.role ?? null;
  const role = normalizeRole(rawRole);

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isSpeaker = role === "speaker";

  const { data: workshopData } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

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

  const { data: sessionData } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const sessions = (sessionData ?? []) as WorkshopSession[];

  const sessionIds = sessions.map((session) => session.id);

  let subsessions: WorkshopSubsession[] = [];

  if (sessionIds.length > 0) {
    const { data: subsessionsData } = await supabase
      .from("workshop_subsessions")
      .select("*")
      .in("session_id", sessionIds)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    subsessions = (subsessionsData ?? []) as WorkshopSubsession[];
  }

  const subsessionsBySessionId = new Map<string, WorkshopSubsession[]>();

  for (const subsession of subsessions) {
    if (!subsession.session_id) continue;

    const existing = subsessionsBySessionId.get(subsession.session_id) ?? [];
    existing.push(subsession);
    subsessionsBySessionId.set(subsession.session_id, existing);
  }

  const userEmail = user?.email?.toLowerCase() ?? "";

  function isAssignedToSpeaker(email?: string | null) {
    if (!isSpeaker || !userEmail || !email) {
      return false;
    }

    return email.toLowerCase().trim() === userEmail;
  }

  const canSeeAllPrivateAccess =
    isAdmin || isManager || hasConfirmedWorkshopAccess(registration);

  const canSeeWorkshopCost =
    isAdmin || isManager || (Boolean(registration) && !isSpeaker);

  const canRegister =
    Boolean(user) && !registration && !isAdmin && !isManager && !isSpeaker;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/workshops"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Workshop
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
          {workshop.title || "Workshop"}
        </h1>

        {workshop.short_description ? (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {workshop.short_description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
          {workshop.level ? (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              {workshop.level}
            </span>
          ) : null}

          {workshop.starts_at ? (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              {formatDate(workshop.starts_at)}
            </span>
          ) : null}

          {canSeeWorkshopCost ? (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              {formatWorkshopPrice(workshop)}
            </span>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {isAdmin || isManager ? (
        <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-800">
          <p className="font-bold">Management preview mode</p>
          <p className="mt-1 text-sm leading-6">
            Workshop session links, materials, recordings, videos, and
            subsessions are unlocked for this account.
          </p>
        </div>
      ) : null}

      {!user ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-bold">Create an account to register</p>
          <p className="mt-1 text-sm leading-6">
            Please create an account or login before submitting a workshop
            registration.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/signup?redirect=/workshops/${slug}`}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              Create account
            </Link>

            <Link
              href={`/login?redirect=/workshops/${slug}`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white"
            >
              Login
            </Link>
          </div>
        </div>
      ) : canRegister ? (
        <form action={registerForWorkshop} className="mb-8">
          <input type="hidden" name="workshop_id" value={workshop.id} />
          <input type="hidden" name="slug" value={slug} />

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Register for this workshop
          </button>
        </form>
      ) : registration && !canSeeAllPrivateAccess && !isSpeaker ? (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
          <p className="font-bold">Registration submitted</p>
          <p className="mt-1 text-sm leading-6">
            Please check your dashboard and message box for updates from the
            LexData team.
          </p>

          <Link
            href="/dashboard/messages"
            className="mt-4 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Open message box
          </Link>
        </div>
      ) : null}

      {workshop.description ? (
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Workshop overview
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">
            {workshop.description}
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
            Sessions
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Session arrangements
          </h2>

          <p className="mt-3 max-w-3xl text-slate-600">
            Registered members with confirmed access can view available session
            details, materials, links, recordings, and subsessions.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-slate-600">
            No sessions have been published yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => {
              const childSubsessions =
                subsessionsBySessionId.get(session.id) ?? [];

              const speakerOwnsSession = isAssignedToSpeaker(
                session.speaker_email
              );

              const canSeeThisSessionPrivate =
                canSeeAllPrivateAccess || speakerOwnsSession;

              const visibleSubsessions = canSeeThisSessionPrivate
                ? childSubsessions
                : childSubsessions.filter((subsession) =>
                    isAssignedToSpeaker(subsession.speaker_email)
                  );

              return (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        {session.title || "Session"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
                        {session.session_date ? (
                          <span>{session.session_date}</span>
                        ) : null}

                        {session.start_time || session.end_time ? (
                          <span>
                            {session.start_time || "-"} -{" "}
                            {session.end_time || "-"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {session.description ? (
                    <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
                      {session.description}
                    </p>
                  ) : null}

                  {canSeeThisSessionPrivate ? (
                    <>
                      <ResourceButtons
                        meetingUrl={session.meeting_url}
                        recordingUrl={session.recording_url}
                        materialUrl={session.material_url}
                      />

                      <MediaBlock
                        mediaType={session.media_type}
                        mediaUrl={session.media_url}
                      />
                    </>
                  ) : (
                    <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                      Session details are not available for this account.
                    </div>
                  )}

                  {visibleSubsessions.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Subsessions
                      </h4>

                      {visibleSubsessions.map((subsession) => {
                        const speakerOwnsSubsession = isAssignedToSpeaker(
                          subsession.speaker_email
                        );

                        const canSeeThisSubsessionPrivate =
                          canSeeAllPrivateAccess ||
                          speakerOwnsSession ||
                          speakerOwnsSubsession;

                        return (
                          <div
                            key={subsession.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                          >
                            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                              <div>
                                <h5 className="text-lg font-black text-slate-950">
                                  {subsession.title || "Subsession"}
                                </h5>

                                <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
                                  {subsession.start_time ||
                                  subsession.end_time ? (
                                    <span>
                                      {subsession.start_time || "-"} -{" "}
                                      {subsession.end_time || "-"}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {subsession.description ? (
                              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
                                {subsession.description}
                              </p>
                            ) : null}

                            {canSeeThisSubsessionPrivate ? (
                              <>
                                <ResourceButtons
                                  meetingUrl={subsession.meeting_url}
                                  recordingUrl={subsession.recording_url}
                                  materialUrl={subsession.material_url}
                                />

                                <MediaBlock
                                  mediaType={subsession.media_type}
                                  mediaUrl={subsession.media_url}
                                />
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/dashboard/my-learning"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          My Learning
        </Link>

        <Link
          href="/dashboard/messages"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Message Box
        </Link>
      </div>
    </main>
  );
}