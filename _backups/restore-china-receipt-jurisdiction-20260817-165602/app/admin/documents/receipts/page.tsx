import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ReceiptFormatEditor } from "@/components/admin/ReceiptFormatEditor";
import {
  formatDocumentMoney,
  jurisdictionNames,
  normalizeJurisdiction,
} from "@/lib/official-documents";
import {
  reissueRevokedDocumentWithCurrentFormatAction,
  updateReceiptFormatAction,
} from "../actions";
import {
  approveReceiptApplicationAction,
  rejectReceiptApplicationAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jurisdictions = ["PK", "SA"] as const;

export default async function ReceiptManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  noStore();

  const feedback = await searchParams;
  const auth = await requireAdmin("/admin/documents/receipts");

  const [
    formatResult,
    issuerResult,
    applicationResult,
    documentResult,
  ] = await Promise.all([
    auth.admin
      .from("document_format_profiles")
      .select("*")
      .eq("document_type", "receipt")
      .in("jurisdiction", ["PK", "SA"])
      .order("jurisdiction"),

    auth.admin
      .from("document_issuer_profiles")
      .select("jurisdiction,legal_name,trading_name")
      .in("jurisdiction", ["PK", "SA"])
      .order("jurisdiction"),

    auth.admin
      .from("receipt_applications")
      .select("*,workshops(title)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),

    auth.admin
      .from("official_documents")
      .select(
        "id,recipient_name,title,document_number,status,amount,currency,jurisdiction,revocation_reason,created_at,metadata"
      )
      .eq("document_type", "receipt")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const formatByJurisdiction = new Map(
    (formatResult.data || []).map((item: any) => [
      item.jurisdiction,
      item,
    ])
  );

  const issuerByJurisdiction = new Map(
    (issuerResult.data || []).map((item: any) => [
      item.jurisdiction,
      item,
    ])
  );

  const applications = applicationResult.data || [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/documents"
            className="text-sm font-black text-slate-700"
          >
            &larr; Document overview
          </Link>

          <Link
            href="/admin/documents/certificates"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black"
          >
            Open certificate manager
          </Link>
        </div>

        <section className="mt-6 rounded-[2rem] bg-emerald-950 p-8 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Separate receipt workspace
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Receipt applications and issuance
          </h1>

          <p className="mt-4 max-w-3xl text-emerald-100">
            Participants submit a receipt application after payment confirmation.
            Review the legal recipient information before generating the receipt.
          </p>
        </section>

        {feedback.message ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
            {feedback.message}
          </p>
        ) : null}

        {feedback.error ||
        applicationResult.error ||
        formatResult.error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
            {feedback.error ||
              applicationResult.error?.message ||
              formatResult.error?.message}
          </p>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Participant requests
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Pending receipt applications
              </h2>
            </div>

            <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">
              {applications.length} pending
            </span>
          </div>

          <div className="mt-5 grid gap-5">
            {applications.map((application: any) => {
              const workshop = Array.isArray(application.workshops)
                ? application.workshops[0]
                : application.workshops;

              return (
                <article
                  key={application.id}
                  className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                          pending
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                          {
                            jurisdictionNames[
                              normalizeJurisdiction(application.jurisdiction)
                            ]
                          }
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                          {application.recipient_type}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black">
                        {application.recipient_name}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-slate-700">
                        {workshop?.title || "Workshop"}
                      </p>

                      <dl className="mt-5 grid gap-2 text-sm text-slate-600">
                        <div>
                          <dt className="inline font-black">
                            Registration / ID:{" "}
                          </dt>
                          <dd className="inline">
                            {application.recipient_registration_number}
                          </dd>
                        </div>

                        <div>
                          <dt className="inline font-black">
                            Tax / NTN:{" "}
                          </dt>
                          <dd className="inline">
                            {application.recipient_tax_number || "-"}
                          </dd>
                        </div>

                        <div>
                          <dt className="inline font-black">
                            VAT:{" "}
                          </dt>
                          <dd className="inline">
                            {application.recipient_vat_number || "-"}
                          </dd>
                        </div>

                        <div>
                          <dt className="inline font-black">
                            Email:{" "}
                          </dt>
                          <dd className="inline">
                            {application.recipient_email}
                          </dd>
                        </div>

                        <div>
                          <dt className="inline font-black">
                            Address:{" "}
                          </dt>
                          <dd className="inline">
                            {application.recipient_address || "-"}
                          </dd>
                        </div>
                      </dl>

                      {application.participant_note ? (
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          {application.participant_note}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4">
                      <form
                        action={approveReceiptApplicationAction}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                      >
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <h4 className="font-black text-emerald-950">
                          Approve and issue
                        </h4>

                        <p className="mt-2 text-xs leading-5 text-emerald-800">
                          The amount is loaded from the confirmed registration
                          by the server; the participant cannot alter it.
                        </p>

                        <label className="mt-4 block text-sm font-black">
                          Admin note
                          <input
                            name="admin_note"
                            className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3"
                          />
                        </label>

                        <label className="mt-4 flex items-center gap-3 text-sm font-black">
                          <input
                            type="checkbox"
                            name="is_tax_document"
                            value="yes"
                          />
                          Mark as tax document
                        </label>

                        <label className="mt-4 block text-sm font-black">
                          FBR / ZATCA authority reference
                          <input
                            name="authority_reference"
                            placeholder="Required when marked as tax document"
                            className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3"
                          />
                        </label>

                        <label className="mt-4 block text-sm font-black">
                          External official invoice URL
                          <input
                            type="url"
                            name="external_invoice_url"
                            className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3"
                          />
                        </label>

                        <button className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white">
                          Approve and issue receipt
                        </button>
                      </form>

                      <form
                        action={rejectReceiptApplicationAction}
                        className="rounded-2xl border border-red-200 bg-red-50 p-5"
                      >
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <label className="block text-sm font-black text-red-900">
                          Rejection reason
                          <input
                            name="admin_note"
                            required
                            minLength={5}
                            className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3"
                          />
                        </label>

                        <button className="mt-4 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white">
                          Reject application
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}

            {!applications.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                No pending receipt applications.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>Official-record rule:</strong>{" "}
          editing a format changes future receipts only. Already issued receipts
          keep the saved format snapshot.
        </section>

        <section className="mt-10 space-y-8">
          {jurisdictions.map((jurisdiction) => {
            const issuer: any =
              issuerByJurisdiction.get(jurisdiction);

            return (
              <ReceiptFormatEditor
                key={jurisdiction}
                action={updateReceiptFormatAction}
                jurisdiction={jurisdiction}
                jurisdictionName={jurisdictionNames[jurisdiction]}
                issuerName={
                  issuer?.trading_name ||
                  issuer?.legal_name ||
                  "LexData Research & Training"
                }
                initial={formatByJurisdiction.get(jurisdiction)}
              />
            );
          })}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Receipt register
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Issued receipts
              </h2>
            </div>

            <Link
              href="/admin/documents"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
            >
              Compliance controls
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(documentResult.data || []).map((document: any) => (
              <article
                key={document.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black">
                      {document.recipient_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {document.title}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {document.document_number} -{" "}
                      {
                        jurisdictionNames[
                          normalizeJurisdiction(document.jurisdiction)
                        ]
                      }
                    </p>

                    {document.metadata?.recipient_registration_number ? (
                      <p className="mt-2 text-xs font-bold text-slate-600">
                        Recipient reg/ID:{" "}
                        {document.metadata.recipient_registration_number}
                      </p>
                    ) : null}
                  </div>

                  <p className="whitespace-nowrap font-black">
                    {formatDocumentMoney(
                      document.amount,
                      document.currency
                    )}
                  </p>
                </div>

                <Link
                  href={`/documents/${document.id}`}
                  className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-black"
                >
                  Preview receipt
                </Link>

                {document.status === "void" ? (
                  /refund|refunded|cancelled|canceled/i.test(
                    String(document.revocation_reason || "")
                  ) ? (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                      This receipt was voided by a refund or cancellation and
                      cannot be reissued.
                    </p>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-black text-amber-950">
                        Format correction
                      </p>

                      <Link
                        href={`/documents/${document.id}?format=current`}
                        className="mt-3 inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-950"
                      >
                        Preview current format
                      </Link>

                      <form
                        action={reissueRevokedDocumentWithCurrentFormatAction}
                        className="mt-3 flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={document.id}
                        />

                        <input
                          name="correction_reason"
                          required
                          minLength={5}
                          placeholder="Required correction reason"
                          className="min-w-0 flex-1 rounded-xl border border-amber-300 px-3 py-2 text-sm"
                        />

                        <button className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-black text-white">
                          Reissue
                        </button>
                      </form>
                    </div>
                  )
                ) : null}
              </article>
            ))}

            {!documentResult.data?.length ? (
              <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-slate-500">
                No issued receipts yet.
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
