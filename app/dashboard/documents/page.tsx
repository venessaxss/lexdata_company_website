import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDocumentMoney, jurisdictionNames, normalizeJurisdiction } from "@/lib/official-documents";
import { applyForWorkshopCertificateAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  noStore();
  const feedback = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [profileResult, documentResult, registrationResult, applicationResult] = await Promise.all([
    admin.from("profiles").select("full_name,preferred_certificate_name").eq("id", user.id).maybeSingle(),
    admin.from("official_documents").select("id,document_type,document_number,jurisdiction,status,title,amount,currency,created_at,issued_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("workshop_registrations").select("id,workshop_id,registration_status,workshops(title)").eq("user_id", user.id).eq("registration_status", "completed").order("created_at", { ascending: false }),
    admin.from("certificate_applications").select("id,workshop_registration_id,preferred_name,status,admin_note,created_at,workshops(title)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const profile = profileResult.data;
  const documents = documentResult.data;
  const error = documentResult.error;
  const registrations = registrationResult.data || [];
  const applications = applicationResult.data || [];
  const applicationByRegistration = new Map(
    applications.map((application: any) => [application.workshop_registration_id, application])
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard" className="text-sm font-black text-blue-700">&larr; Dashboard</Link>
      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Verified documents</p>
        <h1 className="mt-3 text-4xl font-black">Certificates & receipts</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Receipts appear after payment confirmation. For a workshop certificate, complete the workshop, submit an application here, and wait for admin approval.
        </p>
      </section>

      {feedback.message ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">{feedback.message}</p> : null}
      {feedback.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{feedback.error}</p> : null}

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <strong>Printed name:</strong>{" "}
        {profile?.preferred_certificate_name || profile?.full_name || "Not set"}.{" "}
        <Link href="/dashboard/profile" className="font-black underline">Update your preferred name</Link>
        {" "}before a certificate is issued.
      </div>

      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">{error.message}</p> : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Workshop certificates</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Apply after workshop completion</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">{registrations.length} eligible workshop{registrations.length === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {registrations.map((registration: any) => {
            const application: any = applicationByRegistration.get(registration.id);
            const workshop = Array.isArray(registration.workshops) ? registration.workshops[0] : registration.workshops;
            const title = workshop?.title || "Completed workshop";
            if (application?.status === "pending" || application?.status === "approved") {
              return (
                <article key={registration.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${application.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{application.status}</span>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">Applied as <strong>{application.preferred_name}</strong></p>
                  <p className="mt-3 text-sm font-bold text-slate-600">{application.status === "approved" ? "Approved. Your certificate is available in the document register below." : "Awaiting admin review."}</p>
                </article>
              );
            }

            return (
              <form key={registration.id} action={applyForWorkshopCertificateAction} className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
                <input type="hidden" name="registration_id" value={registration.id} />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Eligible to apply</p>
                <h3 className="mt-2 text-xl font-black">{title}</h3>
                {application?.status === "rejected" ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">Previous application: rejected{application.admin_note ? ` - ${application.admin_note}` : ". You may correct and reapply."}</p> : null}
                <label className="mt-5 block text-sm font-black text-slate-700">
                  Exact name for this certificate
                  <input name="preferred_name" required minLength={2} maxLength={120} defaultValue={application?.preferred_name || profile?.preferred_certificate_name || profile?.full_name || ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
                </label>
                <label className="mt-4 block text-sm font-black text-slate-700">
                  Note to admin (optional)
                  <textarea name="participant_note" rows={3} placeholder="For example: attendance detail or spelling note" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
                </label>
                <button className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Submit certificate application</button>
              </form>
            );
          })}
        </div>

        {!registrations.length ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No completed workshop is eligible yet. After attendance is confirmed and the workshop is marked completed, the application form will appear here.
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black text-slate-950">Issued documents and receipts</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
        {(documents || []).map((document: any) => {
          const jurisdiction = normalizeJurisdiction(document.jurisdiction);
          const released = document.status === "issued";
          return (
            <article key={document.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  {document.document_type}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${released ? "bg-emerald-50 text-emerald-700" : document.status === "pending_review" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                  {document.status.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-950">{document.title}</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{document.document_number}</p>
              <dl className="mt-5 grid gap-2 text-sm text-slate-600">
                <div><dt className="inline font-black">Jurisdiction: </dt><dd className="inline">{jurisdictionNames[jurisdiction]}</dd></div>
                {document.document_type === "receipt" ? <div><dt className="inline font-black">Amount: </dt><dd className="inline">{formatDocumentMoney(document.amount, document.currency)}</dd></div> : null}
                <div><dt className="inline font-black">Released: </dt><dd className="inline">{document.issued_at ? new Date(document.issued_at).toLocaleDateString() : "Awaiting admin review"}</dd></div>
              </dl>
              {released ? (
                <Link href={`/documents/${document.id}`} className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                  Open document
                </Link>
              ) : (
                <p className="mt-6 text-sm font-bold text-amber-700">This document is not released for printing yet.</p>
              )}
            </article>
          );
        })}
        </div>
      </section>

      {!documents?.length && !error ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-600">
          No documents are available yet.
        </div>
      ) : null}
    </main>
  );
}
