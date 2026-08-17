import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  ActiveCertificateFormatEditor,
  CertificateTemplateUploadEditor,
} from "@/components/admin/CertificateFormatEditors";
import {
  updateCertificateTemplateFormatAction,
  uploadCertificateTemplateAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CertificateManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  noStore();
  const feedback = await searchParams;
  const auth = await requireAdmin("/admin/documents/certificates");
  const [workshopResult, templateResult, applicationResult, documentResult] =
    await Promise.all([
      auth.admin.from("workshops").select("id,title").order("title"),
      auth.admin
        .from("certificate_templates")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      auth.admin
        .from("certificate_applications")
        .select("id,status")
        .eq("status", "pending"),
      auth.admin
        .from("official_documents")
        .select("id,recipient_name,title,document_number,status,created_at")
        .eq("document_type", "certificate")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const workshops = workshopResult.data || [];
  const templates = templateResult.data || [];
  const workshopById = new Map(workshops.map((item: any) => [item.id, item.title]));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/documents" className="text-sm font-black text-slate-700">
            &larr; Document overview
          </Link>
          <Link href="/admin/documents/receipts" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black">
            Open receipt manager
          </Link>
        </div>

        <section className="mt-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Separate certificate workspace</p>
          <h1 className="mt-3 text-4xl font-black">Certificate formats</h1>
          <p className="mt-4 max-w-3xl text-blue-100">
            Upload workshop backgrounds, preview sample certificate data, and edit text placement and typography before approving participant applications.
          </p>
        </section>

        {feedback.message ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">{feedback.message}</p> : null}
        {feedback.error || templateResult.error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{feedback.error || templateResult.error?.message}</p> : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5"><p className="text-xs font-black uppercase text-slate-500">Active formats</p><p className="mt-2 text-3xl font-black">{templates.length}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-xs font-black uppercase text-slate-500">Pending applications</p><p className="mt-2 text-3xl font-black">{applicationResult.data?.length || 0}</p></div>
          <div className="rounded-2xl border bg-white p-5"><p className="text-xs font-black uppercase text-slate-500">Certificate records</p><p className="mt-2 text-3xl font-black">{documentResult.data?.length || 0}</p></div>
        </section>

        <section className="mt-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Create format</p>
          <h2 className="mt-2 text-2xl font-black">Upload and preview a certificate</h2>
          <CertificateTemplateUploadEditor action={uploadCertificateTemplateAction} workshops={workshops} />
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Edit formats</p><h2 className="mt-2 text-2xl font-black">Active workshop certificate formats</h2></div>
            <Link href="/admin/documents#certificate-applications" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review certificate applications</Link>
          </div>
          <div className="mt-5 space-y-6">
            {templates.map((template: any) => (
              <div key={template.id}>
                <p className="mb-2 text-sm font-black text-slate-700">{workshopById.get(template.workshop_id) || "Workshop"}</p>
                <ActiveCertificateFormatEditor action={updateCertificateTemplateFormatAction} template={template} />
              </div>
            ))}
            {!templates.length ? <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-slate-500">No active certificate formats yet. Upload the first one above.</div> : null}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Certificate register</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(documentResult.data || []).map((document: any) => (
              <article key={document.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex justify-between gap-3"><div><p className="font-black">{document.recipient_name}</p><p className="mt-1 text-sm text-slate-600">{document.title}</p><p className="mt-2 text-xs text-slate-500">{document.document_number}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{document.status.replace(/_/g, " ")}</span></div>
                <Link href={`/documents/${document.id}`} className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-black">Preview certificate</Link>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
