import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDocumentMoney, jurisdictionNames, normalizeJurisdiction } from "@/lib/official-documents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function maskedEmail(value?: string | null) {
  if (!value?.includes("@")) return null;
  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export default async function VerifyDocumentPage({ params }: { params: Promise<{ code: string }> }) {
  noStore();
  const { code } = await params;
  if (!/^[a-f0-9]{32}$/i.test(code)) notFound();

  const admin = createAdminClient();
  const { data: document } = await admin
    .from("official_documents")
    .select("document_type,document_number,jurisdiction,status,recipient_name,recipient_email,title,amount,currency,issued_at,revoked_at,revocation_reason,is_tax_document,authority_reference")
    .eq("verification_code", code.toLowerCase())
    .maybeSingle();
  if (!document) notFound();

  const valid = document.status === "issued";
  const jurisdiction = normalizeJurisdiction(document.jurisdiction);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <section className={`rounded-[2rem] border p-8 shadow-sm ${valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
        <p className={`text-xs font-black uppercase tracking-[0.24em] ${valid ? "text-emerald-700" : "text-red-700"}`}>Document verification</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">{valid ? "Valid and currently issued" : "Not currently valid"}</h1>
        <p className="mt-3 text-slate-700">This page verifies the record held in the LexData document register.</p>
      </section>

      <dl className="mt-8 grid gap-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:grid-cols-2">
        <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Document</dt><dd className="mt-1 font-black capitalize">{document.document_type}</dd></div>
        <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Number</dt><dd className="mt-1 font-black">{document.document_number}</dd></div>
        <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Participant</dt><dd className="mt-1 font-black">{document.recipient_name}</dd>{maskedEmail(document.recipient_email) ? <dd className="text-sm text-slate-500">{maskedEmail(document.recipient_email)}</dd> : null}</div>
        <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Jurisdiction</dt><dd className="mt-1 font-black">{jurisdictionNames[jurisdiction]}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Program</dt><dd className="mt-1 font-black">{document.title}</dd></div>
        {document.document_type === "receipt" ? <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Confirmed amount</dt><dd className="mt-1 font-black">{formatDocumentMoney(document.amount, document.currency)}</dd></div> : null}
        <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Issued</dt><dd className="mt-1 font-black">{document.issued_at ? new Date(document.issued_at).toLocaleString() : "Not issued"}</dd></div>
        {document.revocation_reason ? <div className="sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wider text-red-600">Revocation note</dt><dd className="mt-1 font-bold">{document.revocation_reason}</dd></div> : null}
      </dl>

      <p className="mt-6 text-xs leading-5 text-slate-500">
        Verification confirms the LexData record only. A payment receipt is not a government tax invoice unless an authority reference is displayed and separately verified.
      </p>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Return home</Link>
    </main>
  );
}
