import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ReceiptFormatEditor } from "@/components/admin/ReceiptFormatEditor";
import { formatDocumentMoney, jurisdictionNames } from "@/lib/official-documents";
import { reissueRevokedDocumentWithCurrentFormatAction, updateReceiptFormatAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const jurisdictions = ["PK", "SA", "CN"] as const;

export default async function ReceiptManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  noStore();
  const feedback = await searchParams;
  const auth = await requireAdmin("/admin/documents/receipts");
  const [formatResult, issuerResult, documentResult] = await Promise.all([
    auth.admin.from("document_format_profiles").select("*").eq("document_type", "receipt").order("jurisdiction"),
    auth.admin.from("document_issuer_profiles").select("jurisdiction,legal_name,trading_name").order("jurisdiction"),
    auth.admin
      .from("official_documents")
      .select("id,recipient_name,title,document_number,status,amount,currency,jurisdiction,revocation_reason,created_at")
      .eq("document_type", "receipt")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const formatByJurisdiction = new Map((formatResult.data || []).map((item: any) => [item.jurisdiction, item]));
  const issuerByJurisdiction = new Map((issuerResult.data || []).map((item: any) => [item.jurisdiction, item]));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/documents" className="text-sm font-black text-slate-700">&larr; Document overview</Link>
          <Link href="/admin/documents/certificates" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black">Open certificate manager</Link>
        </div>

        <section className="mt-6 rounded-[2rem] bg-emerald-950 p-8 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Separate receipt workspace</p>
          <h1 className="mt-3 text-4xl font-black">Receipt formats</h1>
          <p className="mt-4 max-w-3xl text-emerald-100">Preview and edit the organization receipt format separately for Pakistan, Saudi Arabia, and China. Saved designs are snapshotted into future confirmed-payment receipts.</p>
        </section>

        {feedback.message ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">{feedback.message}</p> : null}
        {feedback.error || formatResult.error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{feedback.error || formatResult.error?.message}</p> : null}

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Official-record rule:</strong> editing a format changes future receipts only. Already issued receipts keep the design snapshot that was active when payment was confirmed.</section>

        <section className="mt-10 space-y-8">
          {jurisdictions.map((jurisdiction) => {
            const issuer: any = issuerByJurisdiction.get(jurisdiction);
            return (
              <ReceiptFormatEditor
                key={jurisdiction}
                action={updateReceiptFormatAction}
                jurisdiction={jurisdiction}
                jurisdictionName={jurisdictionNames[jurisdiction]}
                issuerName={issuer?.trading_name || issuer?.legal_name || "LexData Research & Training"}
                initial={formatByJurisdiction.get(jurisdiction)}
              />
            );
          })}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Separate receipt register</p><h2 className="mt-2 text-2xl font-black">Generated receipts</h2></div><Link href="/admin/documents" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Compliance controls</Link></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(documentResult.data || []).map((document: any) => (
              <article key={document.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex justify-between gap-3"><div><p className="font-black">{document.recipient_name}</p><p className="mt-1 text-sm text-slate-600">{document.title}</p><p className="mt-2 text-xs text-slate-500">{document.document_number} · {jurisdictionNames[document.jurisdiction as keyof typeof jurisdictionNames]}</p></div><p className="whitespace-nowrap font-black">{formatDocumentMoney(document.amount, document.currency)}</p></div>
                <Link href={`/documents/${document.id}`} className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-black">Preview receipt</Link>
                {document.status === "void" ? (
                  /refund|refunded|cancelled|canceled/i.test(String(document.revocation_reason || "")) ? (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">This receipt was voided by a refund or cancellation and cannot be reissued.</p>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-black text-amber-950">Format correction</p>
                      <p className="mt-1 text-xs leading-5 text-amber-900">Edit the jurisdiction format above, preview it with this receipt&apos;s data, then reissue.</p>
                      <Link href={`/documents/${document.id}?format=current`} className="mt-3 inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-950">Preview current format</Link>
                      <form action={reissueRevokedDocumentWithCurrentFormatAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="id" value={document.id} />
                        <input name="correction_reason" required minLength={5} placeholder="Required correction reason" className="min-w-0 flex-1 rounded-xl border border-amber-300 px-3 py-2 text-sm" />
                        <button className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-black text-white">Reissue with current format</button>
                      </form>
                    </div>
                  )
                ) : null}
              </article>
            ))}
            {!documentResult.data?.length ? <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-slate-500">No confirmed-payment receipts yet.</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
