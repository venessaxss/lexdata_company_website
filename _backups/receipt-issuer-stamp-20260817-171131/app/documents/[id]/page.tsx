import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import PrintDocumentButton from "@/components/PrintDocumentButton";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatDocumentMoney,
  jurisdictionNames,
  normalizeJurisdiction,
  receiptHeading,
  taxDocumentNotice,
} from "@/lib/official-documents";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function issuer(document: any) {
  return document.issuer_snapshot || {};
}

export default async function OfficialDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  noStore();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: document, error }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    admin.from("official_documents").select("*").eq("id", id).maybeSingle(),
  ]);
  if (error || !document) notFound();

  const isAdmin = normalizeRole(profile?.role) === "admin";
  if (document.user_id !== user.id && !isAdmin) notFound();
  if (document.status !== "issued" && !isAdmin) notFound();

  const requestedPreview = (await searchParams).format === "current";
  let renderedMetadata = { ...(document.metadata || {}) };
  let currentFormatPreview = false;
  if (isAdmin && requestedPreview && ["revoked", "void"].includes(document.status)) {
    if (document.document_type === "receipt") {
      const { data: currentFormat } = await admin
        .from("document_format_profiles")
        .select("*")
        .eq("document_type", "receipt")
        .eq("jurisdiction", document.jurisdiction)
        .maybeSingle();
      if (currentFormat) {
        renderedMetadata = { ...renderedMetadata, receipt_format: currentFormat };
        currentFormatPreview = true;
      }
    } else if (document.source_type === "workshop_registration") {
      const { data: registration } = await admin
        .from("workshop_registrations")
        .select("workshop_id")
        .eq("id", document.source_id)
        .maybeSingle();
      if (registration) {
        const { data: template } = await admin
          .from("certificate_templates")
          .select("*")
          .eq("workshop_id", registration.workshop_id)
          .eq("is_active", true)
          .maybeSingle();
        if (template) {
          renderedMetadata = {
            ...renderedMetadata,
            template_id: template.id,
            template_url: template.background_url,
            text_color: template.text_color,
            name_top_percent: template.name_top_percent,
            program_top_percent: template.program_top_percent,
            details_top_percent: template.details_top_percent,
            name_font_size: template.name_font_size,
            program_font_size: template.program_font_size,
            details_font_size: template.details_font_size,
            font_family: template.font_family,
            completion_label: template.completion_label,
          };
          currentFormatPreview = true;
        }
      }
    }
  }

  const jurisdiction = normalizeJurisdiction(document.jurisdiction);
  const issuerData = issuer(document);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify/${document.verification_code}`;
  const date = document.issued_at || document.payment_confirmed_at || document.created_at;
  const certificateTemplateUrl = renderedMetadata?.template_url as string | undefined;
  const certificateTextColor = /^#[0-9a-fA-F]{6}$/.test(String(renderedMetadata?.text_color || ""))
    ? String(renderedMetadata.text_color)
    : "#0B2545";
  const templatePosition = (key: string, fallback: number) => {
    const value = Number(renderedMetadata?.[key]);
    return Number.isFinite(value) ? `${Math.min(94, Math.max(10, value))}%` : `${fallback}%`;
  };
  const templateFontSize = (key: string, fallback: number, minimum: number, maximum: number) => {
    const value = Number(renderedMetadata?.[key]);
    return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  };
  const certificateNameFont =
    renderedMetadata?.font_family === "sans"
      ? "Arial, sans-serif"
      : "Georgia, serif";
  const receiptFormat = renderedMetadata?.receipt_format || {};
  const formatText = (key: string, fallback: string) => {
    const value = String(receiptFormat?.[key] || "").trim();
    return value || fallback;
  };
  const formatColor = (key: string, fallback: string) => {
    const value = String(receiptFormat?.[key] || "");
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
  };
  const receiptPrimaryColor = formatColor("primary_color", "#0F172A");
  const receiptAccentColor = formatColor("accent_color", "#1D4ED8");
  const receiptLayoutStyle = ["classic", "modern", "compact"].includes(String(receiptFormat.layout_style))
    ? String(receiptFormat.layout_style)
    : "classic";
  const receiptFontFamily = receiptFormat.font_family === "serif" ? "Georgia, serif" : "Arial, sans-serif";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between gap-4 print:hidden">
        <Link href={isAdmin ? `/admin/documents/${document.document_type === "certificate" ? "certificates" : "receipts"}` : document.document_type === "certificate" ? "/dashboard/certificates" : "/dashboard/receipts"} className="text-sm font-black text-slate-700">&larr; Back to documents</Link>
        <PrintDocumentButton />
      </div>
      {currentFormatPreview ? (
        <div className="mx-auto mb-5 max-w-5xl rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900 print:hidden">
          Previewing the current admin format on this revoked document. The saved document is unchanged until the admin reissues it.
        </div>
      ) : null}

      {document.document_type === "certificate" ? (
        certificateTemplateUrl ? (
          <article className="document-sheet custom-certificate-sheet relative mx-auto aspect-[1.414/1] w-full max-w-5xl overflow-hidden bg-white shadow-2xl print:max-w-none print:shadow-none">
            <img src={certificateTemplateUrl} alt="Certificate template" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute left-[7%] right-[7%] -translate-y-1/2 text-center" style={{ top: templatePosition("name_top_percent", 45), color: certificateTextColor }}>
              <p
                className="font-bold leading-tight"
                style={{
                  fontFamily: certificateNameFont,
                  fontSize: `${templateFontSize("name_font_size", 64, 28, 96)}px`,
                }}
              >
                {document.recipient_name}
              </p>
            </div>
            <div className="absolute left-[10%] right-[10%] -translate-y-1/2 text-center" style={{ top: templatePosition("program_top_percent", 61), color: certificateTextColor }}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-75">{String(renderedMetadata?.completion_label || "Successfully completed")}</p>
              <h1
                className="mt-2 font-black leading-tight"
                style={{ fontSize: `${templateFontSize("program_font_size", 30, 16, 56)}px` }}
              >
                {document.title}
              </h1>
            </div>
            <div className="absolute left-[7%] right-[7%] -translate-y-1/2 text-center font-semibold" style={{ top: templatePosition("details_top_percent", 81), color: certificateTextColor, fontSize: `${templateFontSize("details_font_size", 12, 8, 20)}px` }}>
              <p>{new Date(date).toLocaleDateString()} &nbsp; | &nbsp; {document.document_number} &nbsp; | &nbsp; {jurisdictionNames[jurisdiction]}</p>
              <p className="mt-1 opacity-70">Verify: {verifyUrl}</p>
            </div>
          </article>
        ) : (
        <article className="document-sheet certificate-sheet relative mx-auto flex min-h-[720px] max-w-5xl flex-col overflow-hidden bg-[#fffdf7] p-12 text-center shadow-2xl print:min-h-screen print:max-w-none print:shadow-none sm:p-16">
          <div className="absolute inset-4 border-2 border-[#b08d39]" />
          <div className="absolute inset-7 border border-[#d8bf77]" />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-double border-[#b08d39] text-xl font-black text-[#183153]">LD</div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.45em] text-[#8a6b25]">LexData Research & Training</p>
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-tight text-[#183153] sm:text-6xl">Certificate of Completion</h1>
            <p className="mt-8 text-lg text-slate-600">This certificate is proudly presented to</p>
            <p className="mt-5 max-w-4xl border-b border-[#b08d39] px-8 pb-3 font-serif text-4xl font-bold text-slate-950 sm:text-5xl">{document.recipient_name}</p>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-700">for successfully completing</p>
            <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight text-[#183153] sm:text-3xl">{document.title}</h2>
            {document.description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{document.description}</p> : null}
            <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-8 text-sm sm:grid-cols-3">
              <div><p className="border-b border-slate-400 pb-2 font-bold">{new Date(date).toLocaleDateString()}</p><p className="mt-2 text-xs uppercase tracking-wider text-slate-500">Issue date</p></div>
              <div><p className="border-b border-slate-400 pb-2 font-bold">{jurisdictionNames[jurisdiction]}</p><p className="mt-2 text-xs uppercase tracking-wider text-slate-500">Issuing jurisdiction</p></div>
              <div><p className="border-b border-slate-400 pb-2 font-bold">Digitally approved</p><p className="mt-2 text-xs uppercase tracking-wider text-slate-500">Authorized issuer</p></div>
            </div>
          </div>
          <footer className="relative z-10 mt-10 text-[10px] leading-5 text-slate-500">
            <p className="font-bold">Certificate no. {document.document_number}</p>
            <p>Verify: {verifyUrl}</p>
            <p>This is a privately issued training certificate and does not claim governmental accreditation.</p>
          </footer>
        </article>
        )
      ) : (
        <article className={`document-sheet mx-auto max-w-3xl bg-white shadow-2xl print:max-w-none print:shadow-none ${receiptLayoutStyle === "compact" ? "p-6 sm:p-8" : "p-8 sm:p-12"}`} style={{ color: receiptPrimaryColor, fontFamily: receiptFontFamily }}>
          <header
            className={`flex flex-col justify-between gap-6 sm:flex-row ${receiptLayoutStyle === "modern" ? "rounded-2xl p-6 text-white" : "border-b-2 pb-8"}`}
            style={{
              borderColor: receiptPrimaryColor,
              backgroundColor: receiptLayoutStyle === "modern" ? receiptPrimaryColor : undefined,
            }}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: receiptAccentColor }}>{jurisdictionNames[jurisdiction]}</p>
              <h1 className="mt-2 text-3xl font-black">{formatText("heading", receiptHeading(jurisdiction))}</h1>
              <p className="mt-2 text-sm font-bold text-emerald-700">{formatText("subheading", "PAID - PAYMENT CONFIRMED")}</p>
            </div>
            <div className="text-left text-sm sm:text-right">
              <p className="text-xl font-black">{issuerData.legal_name || "LexData Research & Training"}</p>
              {issuerData.trading_name ? <p>{issuerData.trading_name}</p> : null}
              {issuerData.registered_address ? <p className={`mt-1 max-w-xs ${receiptLayoutStyle === "modern" ? "text-slate-200" : "text-slate-600"}`}>{issuerData.registered_address}</p> : null}
              {issuerData.tax_registration_number ? <p className="mt-1 font-bold">Tax ID: {issuerData.tax_registration_number}</p> : null}
            </div>
          </header>

          <section className="grid gap-5 border-b border-slate-200 py-7 text-sm sm:grid-cols-2">
            <div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Received from</p><p className="mt-1 text-lg font-black">{document.recipient_name}</p>{document.recipient_email ? <p className="text-slate-600">{document.recipient_email}</p> : null}</div>
            <div className="sm:text-right"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Receipt details</p><p className="mt-1 font-bold">{document.document_number}</p><p className="text-slate-600">{new Date(date).toLocaleString()}</p></div>
          </section>

          <section className="py-8">
            <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-5">
              <div><p className="font-black">{document.title}</p><p className="mt-1 text-sm text-slate-600">{formatText("service_label", "Confirmed training/service payment")}</p></div>
              <p className="whitespace-nowrap text-xl font-black">{formatDocumentMoney(document.amount, document.currency)}</p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl px-6 py-5 text-white" style={{ backgroundColor: receiptPrimaryColor }}><span className="font-black">Total received</span><span className="text-2xl font-black">{formatDocumentMoney(document.amount, document.currency)}</span></div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-950">
            <p className="font-black">Document classification</p>
            <p>{taxDocumentNotice(jurisdiction, Boolean(document.is_tax_document))}</p>
            {document.authority_reference ? <p className="mt-2 font-bold">Authority reference: {document.authority_reference}</p> : null}
          </section>

          <footer className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
            <p>{formatText("footer_text", "Verify authenticity and current status using the verification code below.")}</p>
            <p className="font-bold">Verification code: {document.verification_code}</p>
            <p>Verify authenticity and current status: {verifyUrl}</p>
          </footer>
        </article>
      )}

      <style>{`
        @page { size: ${document.document_type === "certificate" ? "A4 landscape" : "A4 portrait"}; margin: 8mm; }
        @media print {
          nav, header.site-header, footer.site-footer { display: none !important; }
          .document-sheet { break-inside: avoid; }
          .certificate-sheet { width: 100%; height: 190mm; min-height: 190mm; }
          .custom-certificate-sheet { width: 100%; height: 190mm; }
        }
      `}</style>
    </main>
  );
}
