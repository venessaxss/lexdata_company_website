import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDocumentMoney, jurisdictionNames, normalizeJurisdiction } from "@/lib/official-documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyDocumentsPage() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name,preferred_certificate_name")
    .eq("id", user.id)
    .maybeSingle();
  const { data: documents, error } = await admin
    .from("official_documents")
    .select("id,document_type,document_number,jurisdiction,status,title,amount,currency,created_at,issued_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard" className="text-sm font-black text-blue-700">&larr; Dashboard</Link>
      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Verified documents</p>
        <h1 className="mt-3 text-4xl font-black">Certificates & receipts</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Receipts appear only after payment confirmation. Certificates are released after completion and admin approval.
        </p>
      </section>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <strong>Printed name:</strong>{" "}
        {profile?.preferred_certificate_name || profile?.full_name || "Not set"}.{" "}
        <Link href="/dashboard/profile" className="font-black underline">Update your preferred name</Link>
        {" "}before a certificate is issued.
      </div>

      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">{error.message}</p> : null}

      <section className="mt-8 grid gap-5 md:grid-cols-2">
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
      </section>

      {!documents?.length && !error ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-600">
          No documents are available yet.
        </div>
      ) : null}
    </main>
  );
}
