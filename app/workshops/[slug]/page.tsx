import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import PaymentReceiptUploadForm from "@/components/PaymentReceiptUploadForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    message?: string | string[];
  }>;
};

type Workshop = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  long_description?: string | null;
  audience?: string | null;
  price?: number | null;
  currency?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  is_published?: boolean | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type WorkshopSession = {
  id: string;
  workshop_id: string;
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

type Registration = {
  id: string;
  workshop_id: string;
  user_id: string;
  registration_status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  payment_note?: string | null;
  receipt_url?: string | null;
  payment_currency?: string | null;
  amount_received?: number | null;
};

function cleanRedirectMessage(message: string) {
  return encodeURIComponent(message);
}

async function registerForWorkshopAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") || "").trim();
  const workshopId = String(formData.get("workshop_id") || "").trim();

  if (!slug || !workshopId) {
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

  const { data: workshop } = await admin
    .from("workshops")
    .select("id, price, currency")
    .eq("id", workshopId)
    .maybeSingle();

  if (!workshop) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Workshop was not found."
      )}`
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const userEmail =
    profile?.email || user.email || user.user_metadata?.email || "";

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    userEmail.split("@")[0] ||
    "Registered participant";

  const { data: existingRegistration } = await admin
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRegistration) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "You are already registered for this workshop."
      )}`
    );
  }

  const isFreeWorkshop =
    workshop.price === null ||
    workshop.price === undefined ||
    Number(workshop.price) === 0;

  const { error } = await admin.from("workshop_registrations").insert({
    workshop_id: workshopId,
    user_id: user.id,
    full_name: fullName,
    email: userEmail,
    registration_status: isFreeWorkshop ? "confirmed" : "pending",
    payment_status: isFreeWorkshop ? "waived" : "pending",
    payment_currency: workshop.currency || "USD",
    amount_received: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        `Registration failed: ${error.message}`
      )}`
    );
  }

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/manager/registrations");
  revalidatePath("/dashboard/my-learning");

  redirect(
    `/workshops/${slug}?message=${cleanRedirectMessage(
      isFreeWorkshop
        ? "Registration confirmed. Your course access is now unlocked."
        : "Registration submitted successfully. Please wait for payment instructions."
    )}`
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "To be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status?: string | null) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRegistrationOpen(workshop: Workshop) {
  const status = workshop.recruitment_status || "open";

  return (
    status === "open" ||
    status === "recruiting" ||
    status === "active" ||
    status === "published"
  );
}

function sortByOrderAndTime<
  T extends { display_order?: number | null; start_time?: string | null }
>(a: T, b: T) {
  const orderA = a.display_order ?? 0;
  const orderB = b.display_order ?? 0;

  if (orderA !== orderB) return orderA - orderB;

  const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
  const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;

  return timeA - timeB;
}

function renderWorkshopMedia(workshop: Workshop) {
  if (!workshop.media_url) {
    return null;
  }

  if (workshop.media_type === "image") {
    return (
      <img
        src={workshop.media_url}
        alt={workshop.title}
        className="h-80 w-full rounded-3xl object-cover"
      />
    );
  }

  if (workshop.media_type === "video") {
    return (
      <video
        src={workshop.media_url}
        controls
        className="h-80 w-full rounded-3xl bg-slate-950 object-cover"
      />
    );
  }

  if (workshop.media_type === "audio") {
    return (
      <div className="rounded-3xl bg-slate-100 p-6">
        <audio src={workshop.media_url} controls className="w-full" />
      </div>
    );
  }

  return (
    <a
      href={workshop.media_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
    >
      Open media
    </a>
  );
}

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: PageProps) {
  noStore();

  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawMessage = resolvedSearchParams.message;
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workshopData, error: workshopError } = await admin
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (workshopError) {
    return (
      <main className="p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
          Error loading workshop: {workshopError.message}
        </div>
      </main>
    );
  }

  if (!workshopData) {
    return (
      <main className="p-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 font-bold text-amber-800">
          Workshop not found. Check this slug in Supabase: {slug}
        </div>
      </main>
    );
  }

  const workshop = workshopData as Workshop;

  let existingRegistration: Registration | null = null;

  if (user) {
    const { data: registrationData } = await admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    existingRegistration = registrationData as Registration | null;
  }

  const { data: sessionsData } = await admin
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id);

  const sessions = ((sessionsData ?? []) as WorkshopSession[])
    .filter((session) => session.is_active !== false)
    .sort(sortByOrderAndTime);

  const sessionIds = sessions.map((session) => session.id);

  let subsessions: WorkshopSubsession[] = [];

  if (sessionIds.length > 0) {
    const { data: subsessionsData } = await admin
      .from("workshop_subsessions")
      .select("*")
      .in("session_id", sessionIds);

    subsessions = ((subsessionsData ?? []) as WorkshopSubsession[])
      .filter((subsession) => subsession.is_active !== false)
      .sort(sortByOrderAndTime);
  }

  const subsessionsBySessionId = new Map<string, WorkshopSubsession[]>();

  for (const subsession of subsessions) {
    const current = subsessionsBySessionId.get(subsession.session_id) ?? [];
    current.push(subsession);
    subsessionsBySessionId.set(subsession.session_id, current);
  }

  const registrationStatus =
    existingRegistration?.registration_status || "pending";

  const paymentStatus = existingRegistration?.payment_status || "pending";

  const canAccessPrivateContent =
    existingRegistration?.registration_status === "confirmed" ||
    existingRegistration?.payment_status === "confirmed" ||
    existingRegistration?.payment_status === "waived";

  const managerHasSentPaymentInstructions =
    paymentStatus === "instructions_sent" ||
    paymentStatus === "under_review" ||
    Boolean(existingRegistration?.payment_link) ||
    Boolean(existingRegistration?.payment_note);

  const canUploadPaymentReceipt =
    Boolean(existingRegistration) &&
    registrationStatus !== "cancelled" &&
    registrationStatus !== "rejected" &&
    paymentStatus !== "confirmed" &&
    paymentStatus !== "waived" &&
    managerHasSentPaymentInstructions;

  const isWaitingForPaymentInstructions =
    Boolean(existingRegistration) &&
    registrationStatus !== "cancelled" &&
    registrationStatus !== "rejected" &&
    paymentStatus !== "confirmed" &&
    paymentStatus !== "waived" &&
    !managerHasSentPaymentInstructions;

  const canSubmitNewRegistration =
    Boolean(user) && !existingRegistration && isRegistrationOpen(workshop);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl">
        {message ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
            {message}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h1 className="text-4xl font-black text-slate-950">
                {workshop.title}
              </h1>

              {workshop.summary ? (
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  {workshop.summary}
                </p>
              ) : null}

              {workshop.media_url ? (
                <div className="mt-8">{renderWorkshopMedia(workshop)}</div>
              ) : null}
            </section>

            <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black text-slate-950">
                About this workshop
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                {workshop.description ? <p>{workshop.description}</p> : null}
                {workshop.long_description ? (
                  <p>{workshop.long_description}</p>
                ) : null}
                {!workshop.description && !workshop.long_description ? (
                  <p>Detailed workshop information will be updated soon.</p>
                ) : null}
              </div>
            </section>

            {isWaitingForPaymentInstructions ? (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
                <h2 className="text-2xl font-black text-slate-950">
                  Waiting for payment instructions
                </h2>
                <p className="mt-3 text-sm leading-7 text-amber-800">
                  Your registration has been received. The manager will send
                  payment instructions soon.
                </p>
              </section>
            ) : null}

            {canUploadPaymentReceipt && existingRegistration ? (
              <PaymentReceiptUploadForm
                slug={workshop.slug}
                workshopId={workshop.id}
                registrationId={existingRegistration.id}
                receiptUrl={existingRegistration.receipt_url}
              />
            ) : null}

            <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Sessions and learning materials
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Confirmed participants can access meeting links,
                    recordings, and materials here.
                  </p>
                </div>

                {canAccessPrivateContent ? (
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                    Access unlocked
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                    Locked until confirmation
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-5">
                {sessions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">
                    No sessions have been published yet.
                  </div>
                ) : null}

                {sessions.map((session, index) => {
                  const childSubsessions =
                    subsessionsBySessionId.get(session.id) ?? [];

                  return (
                    <article
                      key={session.id}
                      className="rounded-3xl border border-slate-200 p-6"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                        Session {index + 1}
                      </p>

                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {session.title || "Untitled session"}
                      </h3>

                      {session.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {session.description}
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs font-bold text-slate-500">
                        {formatDateTime(session.start_time)} to{" "}
                        {formatDateTime(session.end_time)}
                      </p>

                      {canAccessPrivateContent ? (
                        <div className="mt-5 flex flex-wrap gap-3">
                          {session.meeting_url ? (
                            <a
                              href={session.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                            >
                              Join meeting
                            </a>
                          ) : null}

                          {session.recording_url ? (
                            <a
                              href={session.recording_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
                            >
                              Recording
                            </a>
                          ) : null}

                          {session.material_url ? (
                            <a
                              href={session.material_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
                            >
                              Materials
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                          Private session links and materials will unlock after
                          your registration/payment is confirmed.
                        </p>
                      )}

                      {childSubsessions.length > 0 ? (
                        <div className="mt-6 space-y-3">
                          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                            Subsessions
                          </h4>

                          {childSubsessions.map((subsession) => (
                            <div
                              key={subsession.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <h5 className="font-black text-slate-950">
                                {subsession.title || "Untitled subsession"}
                              </h5>

                              {subsession.description ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {subsession.description}
                                </p>
                              ) : null}

                              <p className="mt-2 text-xs font-bold text-slate-500">
                                {formatDateTime(subsession.start_time)} to{" "}
                                {formatDateTime(subsession.end_time)}
                              </p>

                              {canAccessPrivateContent ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {subsession.meeting_url ? (
                                    <a
                                      href={subsession.meeting_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                                    >
                                      Join
                                    </a>
                                  ) : null}

                                  {subsession.recording_url ? (
                                    <a
                                      href={subsession.recording_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-700"
                                    >
                                      Recording
                                    </a>
                                  ) : null}

                                  {subsession.material_url ? (
                                    <a
                                      href={subsession.material_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-700"
                                    >
                                      Material
                                    </a>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black text-slate-950">
                Registration
              </h2>

              <div className="mt-6">
                {!user ? (
                  <Link
                    href={`/login?redirect=/workshops/${workshop.slug}`}
                    className="flex w-full items-center justify-center rounded-3xl bg-slate-950 px-6 py-5 text-lg font-black text-white"
                  >
                    Log in to register
                  </Link>
                ) : null}

                {canSubmitNewRegistration ? (
                  <form action={registerForWorkshopAction}>
                    <input type="hidden" name="slug" value={workshop.slug} />
                    <input
                      type="hidden"
                      name="workshop_id"
                      value={workshop.id}
                    />

                    <button
                      type="submit"
                      className="w-full rounded-3xl bg-slate-950 px-6 py-5 text-lg font-black text-white"
                    >
                      Register now
                    </button>
                  </form>
                ) : null}

                {existingRegistration ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-500">
                        Registration status
                      </p>
                      <p className="mt-2 font-black text-slate-950">
                        {statusLabel(registrationStatus)}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-500">
                        Payment status
                      </p>
                      <p className="mt-2 font-black text-slate-950">
                        {statusLabel(paymentStatus)}
                      </p>
                    </div>

                    {existingRegistration.payment_note ? (
                      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <p className="text-sm font-black text-blue-700">
                          Payment note
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                          {existingRegistration.payment_note}
                        </p>
                      </div>
                    ) : null}

                    {existingRegistration.payment_link ? (
                      <a
                        href={existingRegistration.payment_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center rounded-3xl bg-blue-700 px-5 py-4 text-sm font-black text-white"
                      >
                        Open payment link
                      </a>
                    ) : null}

                    {existingRegistration.receipt_url ? (
                      <a
                        href={existingRegistration.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center rounded-3xl border border-slate-300 px-5 py-4 text-sm font-black text-slate-700"
                      >
                        View uploaded receipt
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}