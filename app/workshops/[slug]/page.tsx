import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";
import PaymentReceiptUploadForm from "@/components/PaymentReceiptUploadForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    message?: string;
  }>;
};

type Workshop = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  cover_image_url?: string | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  status_note?: string | null;
  is_published?: boolean | null;
};

type Profile = {
  id: string;
  role?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type ExistingRegistration = {
  id: string;
  user_id: string;
  workshop_id: string;
  registration_status?: string | null;
  payment_status?: string | null;
  receipt_url?: string | null;
  payment_note?: string | null;
  payment_link?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
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
  speaker_email?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type WorkshopSubsession = {
  id: string;
  session_id: string;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

function cleanRedirectMessage(message: string) {
  return encodeURIComponent(message);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (!amount || amount <= 0) {
    return "Free / To be confirmed";
  }

  return `${currency || "USD"} ${amount}`;
}

function statusLabel(value?: string | null) {
  if (!value) return "Pending";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(value?: string | null) {
  if (value === "confirmed" || value === "approved" || value === "open") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    value === "under_review" ||
    value === "pending" ||
    value === "in_progress"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (value === "closed" || value === "terminated" || value === "rejected") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "completed" || value === "waived") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

function canAccessPrivateContent({
  role,
  existingRegistration,
}: {
  role: string;
  existingRegistration: ExistingRegistration | null;
}) {
  if (role === "admin" || role === "manager") {
    return true;
  }

  if (!existingRegistration) {
    return false;
  }

  return (
    existingRegistration.registration_status === "confirmed" ||
    existingRegistration.registration_status === "approved" ||
    existingRegistration.payment_status === "confirmed" ||
    existingRegistration.payment_status === "waived"
  );
}

async function registerForWorkshopAction(formData: FormData) {
  "use server";

  const workshopId = String(formData.get("workshop_id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!workshopId || !slug) {
    redirect("/workshops");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/workshops/${slug}`);
  }

  const admin = createAdminClient();

  const { data: workshop, error: workshopError } = await admin
    .from("workshops")
    .select("id, slug, recruitment_status, process_status")
    .eq("id", workshopId)
    .maybeSingle();

  if (workshopError) {
    throw new Error(`Workshop registration query failed: ${workshopError.message}`);
  }

  if (!workshop) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Workshop was not found"
      )}`
    );
  }

  const recruitmentStatus = workshop.recruitment_status || "open";
  const processStatus = workshop.process_status || "not_started";

  if (
    recruitmentStatus !== "open" ||
    recruitmentStatus === "terminated" ||
    processStatus === "terminated"
  ) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Registration is not currently available for this workshop"
      )}`
    );
  }

  const { data: existingRegistration } = await admin
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRegistration) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "You have already registered for this workshop"
      )}`
    );
  }

  await admin.from("workshop_registrations").insert({
    workshop_id: workshopId,
    user_id: user.id,
    registration_status: "pending",
    payment_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");

  redirect(
    `/workshops/${slug}?message=${cleanRedirectMessage(
      "Registration submitted successfully"
    )}`
  );
}

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: PageProps) {
  noStore();

  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const message = resolvedSearchParams?.message;

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: workshopData, error: workshopError } = await admin
    .from("workshops")
    .select(
      `
      id,
      slug,
      title,
      summary,
      description,
      price,
      currency,
      start_date,
      end_date,
      location,
      cover_image_url,
      recruitment_status,
      process_status,
      status_note,
      is_published
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (workshopError) {
    console.error("Workshop detail query failed:", workshopError);
    throw new Error(`Workshop detail query failed: ${workshopError.message}`);
  }

  if (!workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let existingRegistration: ExistingRegistration | null = null;

  if (user) {
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Workshop profile query failed:", profileError);
    }

    profile = profileData as Profile | null;

    const { data: registrationData, error: registrationError } = await admin
      .from("workshop_registrations")
      .select(
        `
        id,
        user_id,
        workshop_id,
        registration_status,
        payment_status,
        receipt_url,
        payment_note,
        payment_link,
        payment_method,
        payment_reference,
        amount_received,
        payment_currency
      `
      )
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (registrationError) {
      console.error("Workshop registration query failed:", registrationError);
    }

    existingRegistration = registrationData as ExistingRegistration | null;
  }

  const role = normalizeRole(profile?.role);
  const isAdminOrManager = role === "admin" || role === "manager";

  if (!workshop.is_published && !isAdminOrManager) {
    notFound();
  }

  const recruitmentStatus = workshop.recruitment_status || "open";
  const processStatus = workshop.process_status || "not_started";

  const registrationIsOpen =
    recruitmentStatus === "open" && processStatus !== "terminated";

  const canSubmitNewRegistration =
    Boolean(user) && registrationIsOpen && !existingRegistration;

  const canUploadPaymentReceipt =
    Boolean(existingRegistration) &&
    existingRegistration?.registration_status !== "cancelled" &&
    existingRegistration?.registration_status !== "rejected" &&
    existingRegistration?.payment_status !== "confirmed" &&
    existingRegistration?.payment_status !== "waived";

  const privateContentAllowed = canAccessPrivateContent({
    role,
    existingRegistration,
  });

  const { data: sessionsData, error: sessionsError } = await admin
    .from("workshop_sessions")
    .select(
      `
      id,
      workshop_id,
      title,
      description,
      session_date,
      start_time,
      end_time,
      meeting_url,
      recording_url,
      material_url,
      speaker_email,
      display_order,
      is_active
    `
    )
    .eq("workshop_id", workshop.id)
    .neq("is_active", false)
    .order("display_order", { ascending: true })
    .order("session_date", { ascending: true });

  if (sessionsError) {
    console.error("Workshop sessions query failed:", sessionsError);
  }

  let sessions = (sessionsData ?? []) as WorkshopSession[];

  if (role === "speaker" && profile?.email && !privateContentAllowed) {
    sessions = sessions.filter(
      (session) =>
        session.speaker_email?.toLowerCase() === profile.email?.toLowerCase()
    );
  }

  const sessionIds = sessions.map((session) => session.id);

  let subsessions: WorkshopSubsession[] = [];

  if (sessionIds.length > 0) {
    const { data: subsessionsData, error: subsessionsError } = await admin
      .from("workshop_subsessions")
      .select(
        `
        id,
        session_id,
        title,
        description,
        start_time,
        end_time,
        meeting_url,
        recording_url,
        material_url,
        media_type,
        media_url,
        display_order,
        is_active
      `
      )
      .in("session_id", sessionIds)
      .neq("is_active", false)
      .order("display_order", { ascending: true });

    if (subsessionsError) {
      console.error("Workshop subsessions query failed:", subsessionsError);
    }

    subsessions = (subsessionsData ?? []) as WorkshopSubsession[];
  }

  const subsessionsBySessionId = subsessions.reduce<
    Record<string, WorkshopSubsession[]>
  >((result, subsession) => {
    if (!result[subsession.session_id]) {
      result[subsession.session_id] = [];
    }

    result[subsession.session_id].push(subsession);

    return result;
  }, {});

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {message ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
          {message}
        </div>
      ) : null}

      <div className="mb-8">
        <Link
          href="/workshops"
          className="text-sm font-bold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {workshop.cover_image_url ? (
          <img
            src={workshop.cover_image_url}
            alt={workshop.title}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-slate-950 text-5xl font-black text-white">
            LexData
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full border px-4 py-2 text-xs font-black ${getStatusClass(
                recruitmentStatus
              )}`}
            >
              Recruitment: {statusLabel(recruitmentStatus)}
            </span>

            <span
              className={`rounded-full border px-4 py-2 text-xs font-black ${getStatusClass(
                processStatus
              )}`}
            >
              Course: {statusLabel(processStatus)}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700">
              {formatMoney(workshop.price, workshop.currency)}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            {workshop.title}
          </h1>

          {workshop.summary ? (
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              {workshop.summary}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Start
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {formatDate(workshop.start_date)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                End
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {formatDate(workshop.end_date)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Location
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {workshop.location || "Online / To be confirmed"}
              </p>
            </div>
          </div>

          {workshop.status_note ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
              {workshop.status_note}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              About this workshop
            </h2>

            <div className="mt-4 whitespace-pre-line leading-8 text-slate-600">
              {workshop.description ||
                workshop.summary ||
                "No description yet."}
            </div>
          </div>

          {privateContentAllowed || role === "speaker" ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                Sessions, subsessions, and materials
              </h2>

              {sessions.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {sessions.map((session) => {
                    const sessionSubsessions =
                      subsessionsBySessionId[session.id] ?? [];

                    return (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <h3 className="text-lg font-black text-slate-950">
                          {session.title || "Untitled session"}
                        </h3>

                        {session.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {session.description}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          {session.session_date ? (
                            <span>{formatDate(session.session_date)}</span>
                          ) : null}
                          {session.start_time ? (
                            <span>{session.start_time}</span>
                          ) : null}
                          {session.end_time ? (
                            <span>- {session.end_time}</span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {session.meeting_url ? (
                            <a
                              href={session.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                            >
                              Join session
                            </a>
                          ) : null}

                          {session.material_url ? (
                            <a
                              href={session.material_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Materials
                            </a>
                          ) : null}

                          {session.recording_url ? (
                            <a
                              href={session.recording_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Recording
                            </a>
                          ) : null}
                        </div>

                        {sessionSubsessions.length > 0 ? (
                          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                              Subsessions
                            </p>

                            {sessionSubsessions.map((subsession) => (
                              <div
                                key={subsession.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                              >
                                <h4 className="text-base font-black text-slate-950">
                                  {subsession.title || "Untitled subsession"}
                                </h4>

                                {subsession.description ? (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {subsession.description}
                                  </p>
                                ) : null}

                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                  {subsession.start_time ? (
                                    <span>{subsession.start_time}</span>
                                  ) : null}
                                  {subsession.end_time ? (
                                    <span>- {subsession.end_time}</span>
                                  ) : null}
                                  {subsession.media_type ? (
                                    <span>{subsession.media_type}</span>
                                  ) : null}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                  {subsession.meeting_url ? (
                                    <a
                                      href={subsession.meeting_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                                    >
                                      Join subsession
                                    </a>
                                  ) : null}

                                  {subsession.material_url ? (
                                    <a
                                      href={subsession.material_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                      Materials
                                    </a>
                                  ) : null}

                                  {subsession.recording_url ? (
                                    <a
                                      href={subsession.recording_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                      Recording
                                    </a>
                                  ) : null}

                                  {subsession.media_url ? (
                                    <a
                                      href={subsession.media_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                      Media
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No sessions have been added yet.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <h2 className="text-2xl font-black text-slate-950">
                Private course materials
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Session links, subsessions, recordings, and materials are
                available after your registration or payment is approved.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Registration
            </h2>

            {!user ? (
              <div className="mt-4">
                <p className="text-sm leading-6 text-slate-600">
                  Please log in to register for this workshop.
                </p>

                <Link
                  href={`/login?redirect=/workshops/${workshop.slug}`}
                  className="mt-5 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                >
                  Log in to register
                </Link>
              </div>
            ) : existingRegistration ? (
              <div className="mt-4 space-y-4">
                <div
                  className={`rounded-2xl border p-4 ${getStatusClass(
                    existingRegistration.registration_status || "pending"
                  )}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    Registration status
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {statusLabel(existingRegistration.registration_status)}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${getStatusClass(
                    existingRegistration.payment_status || "pending"
                  )}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    Payment status
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {statusLabel(existingRegistration.payment_status)}
                  </p>
                </div>

                {privateContentAllowed ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    Access unlocked. You can view sessions, subsessions, and
                    private materials.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                    Access is waiting for registration or payment approval.
                  </div>
                )}

                {existingRegistration.payment_link ? (
                  <a
                    href={existingRegistration.payment_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full justify-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
                  >
                    Open payment link
                  </a>
                ) : null}

                {existingRegistration.receipt_url ? (
                  <a
                    href={existingRegistration.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    View uploaded receipt
                  </a>
                ) : null}
              </div>
            ) : registrationIsOpen ? (
              <form action={registerForWorkshopAction} className="mt-5">
                <input type="hidden" name="workshop_id" value={workshop.id} />
                <input type="hidden" name="slug" value={workshop.slug} />

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                >
                  Register now
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                New registration is currently closed.
              </div>
            )}
          </section>

          {canUploadPaymentReceipt && existingRegistration ? (
            <PaymentReceiptUploadForm
              slug={workshop.slug}
              registrationId={existingRegistration.id}
              receiptUrl={existingRegistration.receipt_url}
            />
          ) : null}

          {isAdminOrManager ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Management
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/manager/registrations"
                  className="block rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Manage registrations
                </Link>

                <Link
                  href="/manager/workshops"
                  className="block rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Manage workshop status
                </Link>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}