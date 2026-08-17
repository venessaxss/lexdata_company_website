import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatDocumentMoney,
  jurisdictionNames,
  normalizeJurisdiction,
} from "@/lib/official-documents";
import { applyForWorkshopReceiptAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  noStore();

  const feedback = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    profileResult,
    registrationResult,
    applicationResult,
    documentResult,
    issuerResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .maybeSingle(),

    admin
      .from("workshop_registrations")
      .select(
        "id,workshop_id,payment_status,amount_received,payment_currency,email,workshops(title)"
      )
      .eq("user_id", user.id)
      .in("payment_status", ["confirmed", "paid"])
      .order("created_at", { ascending: false }),

    admin
      .from("receipt_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    admin
      .from("official_documents")
      .select(
        "id,document_number,jurisdiction,status,title,amount,currency,issued_at,created_at,metadata"
      )
      .eq("user_id", user.id)
      .eq("document_type", "receipt")
      .order("created_at", { ascending: false }),

    admin
      .from("document_issuer_profiles")
      .select("jurisdiction,legal_name,trading_name")
      .in("jurisdiction", ["PK", "SA"])
      .order("jurisdiction"),
  ]);

  const profile = profileResult.data;

  const registrations = (registrationResult.data || []).filter(
    (item: any) => Number(item.amount_received || 0) > 0
  );

  const applications = applicationResult.data || [];
  const documents = documentResult.data || [];
  const issuers = issuerResult.data || [];

  const applicationByRegistration = new Map(
    applications.map((application: any) => [
      application.workshop_registration_id,
      application,
    ])
  );

  const documentByApplication = new Map(
    documents
      .filter((document: any) => document.metadata?.receipt_application_id)
      .map((document: any) => [
        String(document.metadata.receipt_application_id),
        document,
      ])
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-black text-emerald-700"
        >
          &larr; Dashboard
        </Link>

        <Link
          href="/dashboard/certificates"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black"
        >
          Certificate applications
        </Link>
      </div>

      <section className="mt-6 rounded-[2rem] bg-emerald-950 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Receipt applications
        </p>

        <h1 className="mt-3 text-4xl font-black">
          My receipt requests
        </h1>

        <p className="mt-4 max-w-3xl text-emerald-100">
          After payment is confirmed, submit the legal recipient information
          for the Pakistan or Saudi Arabia issuing entity. The paid amount is
          loaded from the confirmed registration and cannot be edited here.
        </p>
      </section>

      {feedback.message ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
          {feedback.message}
        </p>
      ) : null}

      {feedback.error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
          {feedback.error}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Confirmed payments
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Apply for a receipt
            </h2>
          </div>

          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black">
            {registrations.length} paid
          </span>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {registrations.map((registration: any) => {
            const application: any = applicationByRegistration.get(
              registration.id
            );

            const workshop = Array.isArray(registration.workshops)
              ? registration.workshops[0]
              : registration.workshops;

            const title = workshop?.title || "Workshop payment";

            const issuedDocument = application
              ? documentByApplication.get(String(application.id))
              : null;

            if (
              application &&
              ["pending", "approved"].includes(application.status)
            ) {
              return (
                <article
                  key={registration.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        application.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {application.status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                      {
                        jurisdictionNames[
                          normalizeJurisdiction(application.jurisdiction)
                        ]
                      }
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">{title}</h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Recipient: <strong>{application.recipient_name}</strong>
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Registration / ID:{" "}
                    {application.recipient_registration_number}
                  </p>

                  <p className="mt-3 font-black">
                    {formatDocumentMoney(
                      registration.amount_received,
                      registration.payment_currency
                    )}
                  </p>

                  {application.admin_note ? (
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                      {application.admin_note}
                    </p>
                  ) : null}

                  {issuedDocument ? (
                    <Link
                      href={`/documents/${issuedDocument.id}`}
                      className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                    >
                      Open issued receipt
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm font-bold text-slate-500">
                      {application.status === "approved"
                        ? "Approved. Receipt generation is being finalized."
                        : "Awaiting admin review."}
                    </p>
                  )}
                </article>
              );
            }

            return (
              <form
                key={registration.id}
                action={applyForWorkshopReceiptAction}
                className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <input
                  type="hidden"
                  name="registration_id"
                  value={registration.id}
                />

                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Receipt request available
                </p>

                <h3 className="mt-2 text-xl font-black">{title}</h3>

                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-black">
                  Confirmed amount:{" "}
                  {formatDocumentMoney(
                    registration.amount_received,
                    registration.payment_currency
                  )}
                </p>

                {application?.status === "rejected" ? (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    Previous request: rejected
                    {application.admin_note
                      ? ` - ${application.admin_note}`
                      : ". You may correct and reapply."}
                  </p>
                ) : null}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black">
                    Issuing entity
                    <select
                      name="jurisdiction"
                      required
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    >
                      {issuers.map((issuer: any) => (
                        <option
                          key={issuer.jurisdiction}
                          value={issuer.jurisdiction}
                        >
                          {
                            jurisdictionNames[
                              normalizeJurisdiction(issuer.jurisdiction)
                            ]
                          }{" "}
                          - {issuer.trading_name || issuer.legal_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Recipient type
                    <select
                      name="recipient_type"
                      required
                      defaultValue="personal"
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    >
                      <option value="personal">Personal</option>
                      <option value="company">Company</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Legal recipient name
                    <input
                      name="recipient_name"
                      required
                      minLength={2}
                      maxLength={180}
                      defaultValue={
                        application?.recipient_name ||
                        profile?.full_name ||
                        ""
                      }
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Registration / identity number
                    <input
                      name="recipient_registration_number"
                      required
                      maxLength={120}
                      defaultValue={
                        application?.recipient_registration_number || ""
                      }
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Tax number / NTN
                    <input
                      name="recipient_tax_number"
                      defaultValue={application?.recipient_tax_number || ""}
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    VAT registration number
                    <input
                      name="recipient_vat_number"
                      defaultValue={application?.recipient_vat_number || ""}
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Billing email
                    <input
                      type="email"
                      name="recipient_email"
                      required
                      defaultValue={
                        application?.recipient_email ||
                        registration.email ||
                        profile?.email ||
                        user.email ||
                        ""
                      }
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black">
                    Phone
                    <input
                      name="recipient_phone"
                      defaultValue={application?.recipient_phone || ""}
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black sm:col-span-2">
                    Billing address
                    <input
                      name="recipient_address"
                      defaultValue={application?.recipient_address || ""}
                      className="rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-black sm:col-span-2">
                    Note to admin (optional)
                    <textarea
                      name="participant_note"
                      rows={3}
                      defaultValue={application?.participant_note || ""}
                      className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                    />
                  </label>
                </div>

                <button className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">
                  Submit receipt application
                </button>
              </form>
            );
          })}
        </div>

        {!registrations.length ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No confirmed paid workshop registration is available yet.
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Issued receipts</h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {documents.map((document: any) => (
            <article
              key={document.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                  receipt
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                  {document.status.replace(/_/g, " ")}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">{document.title}</h3>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {document.document_number}
              </p>

              <p className="mt-4 text-lg font-black">
                {formatDocumentMoney(document.amount, document.currency)}
              </p>

              {document.status === "issued" ? (
                <Link
                  href={`/documents/${document.id}`}
                  className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                >
                  Open receipt
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        {!documents.length ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No receipts have been issued yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}
