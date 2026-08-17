import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formatDocumentMoney, jurisdictionNames, normalizeJurisdiction } from "@/lib/official-documents";
import {
  approveCertificateAction,
  approveWorkshopCertificateApplicationAction,
  attachAuthorityReferenceAction,
  rejectWorkshopCertificateApplicationAction,
  revokeDocumentAction,
  updateIssuerProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDocumentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  noStore();
  const filters = await searchParams;
  const auth = await requireAdmin("/admin/documents");
  const [
    { data: documents, error },
    { data: issuerProfiles },
    { data: auditRows },
    { data: applications },
    { data: templates },
  ] = await Promise.all([
    auth.admin.from("official_documents").select("*").order("created_at", { ascending: false }).limit(250),
    auth.admin.from("document_issuer_profiles").select("*").order("jurisdiction"),
    auth.admin.from("official_document_audit_log").select("id,action,from_status,to_status,created_at,official_documents(document_number)").order("created_at", { ascending: false }).limit(15),
    auth.admin.from("certificate_applications").select("id,user_id,workshop_id,preferred_name,participant_note,status,admin_note,created_at,workshops(title)").order("created_at", { ascending: false }).limit(200),
    auth.admin.from("certificate_templates").select("*").order("created_at", { ascending: false }),
  ]);
  const rows = documents || [];
  const pending = rows.filter((row: any) => row.status === "pending_review").length;
  const issued = rows.filter((row: any) => row.status === "issued").length;
  const voided = rows.filter((row: any) => ["void", "revoked"].includes(row.status)).length;
  const pendingApplications = (applications || []).filter((application: any) => application.status === "pending");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin" className="text-sm font-black text-slate-700">&larr; Admin dashboard</Link>
          <Link href="/dashboard/documents" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black">My document view</Link>
        </div>
        <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Controlled issuance register</p>
          <h1 className="mt-3 text-4xl font-black">Certificates & receipts</h1>
          <p className="mt-4 max-w-4xl text-slate-300">Monitor every generated document, approve completion certificates, void incorrect receipts, and connect genuine tax-authority references without mislabeling proof-of-payment records.</p>
        </section>

        {filters.message ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">{filters.message}</p> : null}
        {filters.error || error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{filters.error || error?.message}</p> : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[["Pending applications", pendingApplications.length], ["Currently issued", issued], ["Revoked / void", voided]].map(([label, count]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{count}</p></div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
          <h2 className="font-black">Legal labeling guardrail</h2>
          <p className="mt-2">The system releases organization payment receipts automatically after confirmed funds. Government tax documents remain disabled until the relevant registered entity and real authority integration are configured: FBR in Pakistan, ZATCA FATOORAH in Saudi Arabia, or the State Taxation Administration invoice platform in China.</p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <Link href="/admin/documents/certificates" className="rounded-3xl border border-blue-200 bg-blue-950 p-7 text-white shadow-sm transition hover:-translate-y-0.5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Separate workspace</p>
            <h2 className="mt-3 text-2xl font-black">Certificate Manager</h2>
            <p className="mt-3 text-sm leading-6 text-blue-100">Upload certificate backgrounds, preview sample output, edit text placement and typography, and inspect certificate records.</p>
            <span className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-950">Open certificate formats</span>
          </Link>
          <Link href="/admin/documents/receipts" className="rounded-3xl border border-emerald-200 bg-emerald-950 p-7 text-white shadow-sm transition hover:-translate-y-0.5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Separate workspace</p>
            <h2 className="mt-3 text-2xl font-black">Receipt Manager</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-100">Preview and edit independent receipt designs for Pakistan, Saudi Arabia, and China, then inspect confirmed-payment receipts.</p>
            <span className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-950">Open receipt formats</span>
          </Link>
        </section>

        <section id="certificate-applications" className="mt-10 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Participant requests</p><h2 className="mt-2 text-2xl font-black">Workshop certificate applications</h2></div>
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">{pendingApplications.length} pending</span>
          </div>
          <div className="mt-5 space-y-4">
            {pendingApplications.map((application: any) => {
              const workshop = Array.isArray(application.workshops) ? application.workshops[0] : application.workshops;
              const activeTemplate = (templates || []).find((template: any) => template.workshop_id === application.workshop_id && template.is_active);
              return (
                <article key={application.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Pending review</span><h3 className="mt-3 text-xl font-black">{application.preferred_name}</h3><p className="mt-1 font-bold text-slate-700">{workshop?.title || "Workshop"}</p><p className="mt-1 text-xs text-slate-500">Applied {new Date(application.created_at).toLocaleString()}</p>{application.participant_note ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Participant note: {application.participant_note}</p> : null}</div>
                    <div className="min-w-56">{activeTemplate ? <div className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Template ready: {activeTemplate.template_name}</div> : <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">No active workshop template. Upload one before approval.</div>}</div>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <form action={approveWorkshopCertificateApplicationAction} className="flex gap-3"><input type="hidden" name="application_id" value={application.id} /><input name="admin_note" placeholder="Approval note (optional)" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm" /><button disabled={!activeTemplate} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">Approve & issue</button></form>
                    <form action={rejectWorkshopCertificateApplicationAction} className="flex gap-3"><input type="hidden" name="application_id" value={application.id} /><input name="admin_note" required minLength={5} placeholder="Required rejection reason" className="min-w-0 flex-1 rounded-xl border border-red-200 px-4 py-3 text-sm" /><button className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white">Reject</button></form>
                  </div>
                </article>
              );
            })}
            {!pendingApplications.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No pending workshop certificate applications.</div> : null}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black">Issuance queue and register</h2>
          <div className="mt-4 space-y-4">
            {rows.map((document: any) => {
              const jurisdiction = normalizeJurisdiction(document.jurisdiction);
              return (
                <article key={document.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div>
                      <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase">{document.document_type}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{jurisdictionNames[jurisdiction]}</span><span className={`rounded-full px-3 py-1 text-xs font-black ${document.status === "issued" ? "bg-emerald-50 text-emerald-700" : document.status === "pending_review" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{document.status.replace(/_/g, " ")}</span></div>
                      <h3 className="mt-3 text-xl font-black">{document.recipient_name}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-700">{document.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{document.document_number} · {new Date(document.created_at).toLocaleString()}</p>
                      {document.document_type === "receipt" ? <p className="mt-2 font-black">{formatDocumentMoney(document.amount, document.currency)}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      <Link href={`/documents/${document.id}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black">Preview</Link>
                      {document.document_type === "certificate" && document.status === "pending_review" ? (
                        <form action={approveCertificateAction}><input type="hidden" name="id" value={document.id} /><button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Approve & release</button></form>
                      ) : null}
                    </div>
                  </div>

                  {document.status === "issued" ? (
                    <details className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <summary className="cursor-pointer text-sm font-black">Compliance and revocation controls</summary>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {document.document_type === "receipt" && !document.is_tax_document ? (
                          <form action={attachAuthorityReferenceAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                            <input type="hidden" name="id" value={document.id} />
                            <p className="text-sm font-black">Attach verified tax-authority reference</p>
                            <input name="authority_reference" required placeholder="Fiscal / FATOORAH / fapiao reference" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                            <input name="external_invoice_url" type="url" placeholder="Authority verification URL (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                            <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white">Attach after external issuance</button>
                          </form>
                        ) : null}
                        <form action={revokeDocumentAction} className="space-y-3 rounded-2xl border border-red-100 bg-white p-4">
                          <input type="hidden" name="id" value={document.id} />
                          <p className="text-sm font-black text-red-700">Revoke / void document</p>
                          <input name="reason" required minLength={5} placeholder="Required audit reason" className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm" />
                          <button className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white">Confirm status change</button>
                        </form>
                      </div>
                    </details>
                  ) : null}
                </article>
              );
            })}
            {!rows.length ? <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No generated documents yet.</div> : null}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Issuer and authority settings</h2>
          <div className="mt-4 grid gap-5 xl:grid-cols-3">
            {(issuerProfiles || []).map((profile: any) => (
              <form key={profile.jurisdiction} action={updateIssuerProfileAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <input type="hidden" name="jurisdiction" value={profile.jurisdiction} />
                <h3 className="text-xl font-black">{jurisdictionNames[normalizeJurisdiction(profile.jurisdiction)]}</h3>
                <input name="legal_name" required defaultValue={profile.legal_name || ""} placeholder="Registered legal name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="trading_name" defaultValue={profile.trading_name || ""} placeholder="Trading name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <textarea name="registered_address" defaultValue={profile.registered_address || ""} placeholder="Registered address" rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="tax_registration_number" defaultValue={profile.tax_registration_number || ""} placeholder={profile.jurisdiction === "PK" ? "STRN" : profile.jurisdiction === "SA" ? "VAT registration number" : "Taxpayer ID"} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="secondary_registration_number" defaultValue={profile.secondary_registration_number || ""} placeholder={profile.jurisdiction === "PK" ? "NTN" : "Secondary registration number"} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="contact_email" type="email" defaultValue={profile.contact_email || ""} placeholder="Issuer email" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <select name="authority_integration_status" defaultValue={profile.authority_integration_status || "not_connected"} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"><option value="not_connected">Authority not connected</option><option value="testing">Integration testing</option><option value="connected">Authority connected</option></select>
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="vat_registered" defaultChecked={Boolean(profile.vat_registered)} /> VAT / sales-tax registered</label>
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="tax_invoice_enabled" defaultChecked={Boolean(profile.tax_invoice_enabled)} /> Enable tax-invoice references</label>
                <textarea name="compliance_note" defaultValue={profile.compliance_note || ""} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Save issuer settings</button>
              </form>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Recent audit activity</h2>
          <div className="mt-4 space-y-2 text-sm">
            {(auditRows || []).map((row: any) => <p key={row.id} className="border-t border-slate-100 py-3"><strong>{row.official_documents?.document_number || "Deleted document"}</strong> · {row.action} · {row.from_status || "new"} &rarr; {row.to_status} · {new Date(row.created_at).toLocaleString()}</p>)}
          </div>
        </section>
      </section>
    </main>
  );
}
