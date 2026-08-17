"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { cleanPreferredName, normalizeJurisdiction } from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(key: "message" | "error", message: string) {
  return `/admin/documents?${key}=${encodeURIComponent(message)}`;
}

function refresh() {
  revalidatePath("/admin/documents");
  revalidatePath("/dashboard/documents");
}

export async function approveCertificateAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const id = field(formData, "id");
  if (!id) redirect(back("error", "Missing certificate ID."));

  const { data: document } = await auth.admin
    .from("official_documents")
    .select("id,user_id,document_type,status")
    .eq("id", id)
    .maybeSingle();
  if (!document || document.document_type !== "certificate" || document.status !== "pending_review") {
    redirect(back("error", "Only a pending certificate can be approved."));
  }

  const { data: profile } = await auth.admin
    .from("profiles")
    .select("preferred_certificate_name,full_name,email")
    .eq("id", document.user_id)
    .maybeSingle();
  const preferredName = cleanPreferredName(
    profile?.preferred_certificate_name || profile?.full_name || profile?.email
  );
  if (!preferredName) redirect(back("error", "The participant must set a preferred certificate name first."));

  const { error } = await auth.admin
    .from("official_documents")
    .update({
      recipient_name: preferredName,
      status: "issued",
      issued_at: new Date().toISOString(),
      issued_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_review");
  if (error) redirect(back("error", error.message));

  await auth.admin.from("internal_messages").insert({
    user_id: document.user_id,
    recipient_email: profile?.email || null,
    title: "Certificate released",
    body: "Your certificate has been approved and is now available in Certificates & receipts.",
    source_type: "certificate_issued",
    source_id: id,
  });

  refresh();
  redirect(back("message", "Certificate approved and released."));
}

export async function revokeDocumentAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const id = field(formData, "id");
  const reason = field(formData, "reason");
  if (!id || reason.length < 5) redirect(back("error", "A clear revocation reason is required."));

  const { data: document } = await auth.admin
    .from("official_documents")
    .select("document_type,status")
    .eq("id", id)
    .maybeSingle();
  if (!document || document.status !== "issued") redirect(back("error", "Only an issued document can be revoked."));

  const { error } = await auth.admin
    .from("official_documents")
    .update({
      status: document.document_type === "receipt" ? "void" : "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: auth.user.id,
      revocation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "issued");
  if (error) redirect(back("error", error.message));
  refresh();
  redirect(back("message", "Document status updated and recorded in the audit log."));
}

export async function attachAuthorityReferenceAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const id = field(formData, "id");
  const authorityReference = field(formData, "authority_reference");
  const externalInvoiceUrl = field(formData, "external_invoice_url") || null;
  if (!id || !authorityReference) redirect(back("error", "An authority reference is required."));

  const { data: document } = await auth.admin
    .from("official_documents")
    .select("document_type,jurisdiction,status")
    .eq("id", id)
    .maybeSingle();
  if (!document || document.document_type !== "receipt" || document.status !== "issued") {
    redirect(back("error", "Authority references can only be attached to issued receipts."));
  }

  const { data: issuer } = await auth.admin
    .from("document_issuer_profiles")
    .select("*")
    .eq("jurisdiction", document.jurisdiction)
    .maybeSingle();
  if (issuer?.authority_integration_status !== "connected" || !issuer?.tax_invoice_enabled) {
    redirect(back("error", "Connect and enable the jurisdiction's real tax-authority channel before attaching an official reference."));
  }

  const { error } = await auth.admin
    .from("official_documents")
    .update({
      is_tax_document: true,
      authority_reference: authorityReference,
      external_invoice_url: externalInvoiceUrl,
      issuer_snapshot: issuer,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) redirect(back("error", error.message));
  await auth.admin.from("official_document_audit_log").insert({
    document_id: id,
    actor_id: auth.user.id,
    action: "authority_reference_attached",
    from_status: "issued",
    to_status: "issued",
    details: { authority_reference: authorityReference },
  });
  refresh();
  redirect(back("message", "Verified authority reference attached."));
}

export async function updateIssuerProfileAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const jurisdiction = normalizeJurisdiction(field(formData, "jurisdiction"));
  const legalName = field(formData, "legal_name");
  const authorityStatus = field(formData, "authority_integration_status") || "not_connected";
  const taxInvoiceEnabled = field(formData, "tax_invoice_enabled") === "on";
  if (!legalName) redirect(back("error", "Legal issuer name is required."));
  if (taxInvoiceEnabled && !field(formData, "tax_registration_number")) {
    redirect(back("error", "A tax registration number is required for tax-invoice mode."));
  }
  if (taxInvoiceEnabled && authorityStatus !== "connected") {
    redirect(back("error", "Tax-invoice mode requires a connected authority integration."));
  }

  const { error } = await auth.admin.from("document_issuer_profiles").upsert({
    jurisdiction,
    legal_name: legalName,
    trading_name: field(formData, "trading_name") || null,
    registered_address: field(formData, "registered_address") || null,
    tax_registration_number: field(formData, "tax_registration_number") || null,
    secondary_registration_number: field(formData, "secondary_registration_number") || null,
    contact_email: field(formData, "contact_email") || null,
    vat_registered: field(formData, "vat_registered") === "on",
    tax_invoice_enabled: taxInvoiceEnabled,
    authority_integration_status: ["not_connected", "testing", "connected"].includes(authorityStatus) ? authorityStatus : "not_connected",
    compliance_note: field(formData, "compliance_note") || null,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) redirect(back("error", error.message));
  refresh();
  redirect(back("message", `${jurisdiction} issuer settings saved.`));
}
