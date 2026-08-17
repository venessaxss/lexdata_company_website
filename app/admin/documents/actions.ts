"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { cleanPreferredName, normalizeJurisdiction } from "@/lib/official-documents";

const CERTIFICATE_TEMPLATE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(key: "message" | "error", message: string) {
  return `/admin/documents?${key}=${encodeURIComponent(message)}`;
}

function certificateBack(key: "message" | "error", message: string) {
  return `/admin/documents/certificates?${key}=${encodeURIComponent(message)}`;
}

function receiptBack(key: "message" | "error", message: string) {
  return `/admin/documents/receipts?${key}=${encodeURIComponent(message)}`;
}

function refresh() {
  revalidatePath("/admin/documents");
  revalidatePath("/admin/documents/certificates");
  revalidatePath("/admin/documents/receipts");
  revalidatePath("/dashboard/documents");
}

function boundedPercent(value: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

export async function uploadCertificateTemplateAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents/certificates");
  const workshopId = field(formData, "workshop_id");
  const templateName = field(formData, "template_name");
  const textColor = field(formData, "text_color") || "#0B2545";
  const file = formData.get("template_file") as File | null;

  if (!workshopId || !templateName || !file || file.size === 0) {
    redirect(certificateBack("error", "Workshop, template name, and image file are required."));
  }
  if (!CERTIFICATE_TEMPLATE_TYPES.has(file.type)) {
    redirect(certificateBack("error", "Certificate templates must be PNG, JPG, or WebP images."));
  }
  if (file.size > 10 * 1024 * 1024) {
    redirect(certificateBack("error", "Certificate template must be 10 MB or smaller."));
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(textColor)) {
    redirect(certificateBack("error", "Text color must be a six-digit hex color."));
  }

  const { data: workshop } = await auth.admin
    .from("workshops")
    .select("id")
    .eq("id", workshopId)
    .maybeSingle();
  if (!workshop) redirect(certificateBack("error", "Workshop not found."));

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${workshopId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await auth.admin.storage
    .from("certificate-templates")
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) redirect(certificateBack("error", uploadError.message));

  const { data: publicUrl } = auth.admin.storage
    .from("certificate-templates")
    .getPublicUrl(storagePath);

  const { data: inserted, error: insertError } = await auth.admin
    .from("certificate_templates")
    .insert({
      workshop_id: workshopId,
      template_name: templateName,
      background_url: publicUrl.publicUrl,
      storage_path: storagePath,
      mime_type: file.type,
      text_color: textColor.toUpperCase(),
      name_top_percent: boundedPercent(field(formData, "name_top_percent"), 45, 20, 75),
      program_top_percent: boundedPercent(field(formData, "program_top_percent"), 61, 35, 85),
      details_top_percent: boundedPercent(field(formData, "details_top_percent"), 81, 55, 94),
      name_font_size: boundedPercent(field(formData, "name_font_size"), 64, 28, 96),
      program_font_size: boundedPercent(field(formData, "program_font_size"), 30, 16, 56),
      details_font_size: boundedPercent(field(formData, "details_font_size"), 12, 8, 20),
      completion_label: field(formData, "completion_label") || "Successfully completed",
      font_family: ["serif", "sans"].includes(field(formData, "font_family"))
        ? field(formData, "font_family")
        : "serif",
      is_active: false,
      uploaded_by: auth.user.id,
    })
    .select("id")
    .single();
  if (insertError || !inserted) redirect(certificateBack("error", insertError?.message || "Template record could not be created."));

  await auth.admin
    .from("certificate_templates")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("workshop_id", workshopId)
    .neq("id", inserted.id);
  const { error: activateError } = await auth.admin
    .from("certificate_templates")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", inserted.id);
  if (activateError) redirect(certificateBack("error", activateError.message));

  refresh();
  redirect(certificateBack("message", "Certificate template uploaded and activated for the workshop."));
}

export async function updateCertificateTemplateFormatAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents/certificates");
  const templateId = field(formData, "template_id");
  const textColor = field(formData, "text_color") || "#0B2545";
  const fontFamily = field(formData, "font_family");
  if (!templateId) redirect(certificateBack("error", "Missing certificate template ID."));
  if (!/^#[0-9a-fA-F]{6}$/.test(textColor)) {
    redirect(certificateBack("error", "Text color must be a six-digit hex color."));
  }

  const { error } = await auth.admin
    .from("certificate_templates")
    .update({
      template_name: field(formData, "template_name") || "Certificate template",
      text_color: textColor.toUpperCase(),
      name_top_percent: boundedPercent(field(formData, "name_top_percent"), 45, 20, 75),
      program_top_percent: boundedPercent(field(formData, "program_top_percent"), 61, 35, 85),
      details_top_percent: boundedPercent(field(formData, "details_top_percent"), 81, 55, 94),
      name_font_size: boundedPercent(field(formData, "name_font_size"), 64, 28, 96),
      program_font_size: boundedPercent(field(formData, "program_font_size"), 30, 16, 56),
      details_font_size: boundedPercent(field(formData, "details_font_size"), 12, 8, 20),
      completion_label: field(formData, "completion_label") || "Successfully completed",
      font_family: ["serif", "sans"].includes(fontFamily)
        ? fontFamily
        : "serif",
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .eq("is_active", true);
  if (error) redirect(certificateBack("error", error.message));

  refresh();
  redirect(certificateBack("message", "Certificate format saved. It will be used for future approvals."));
}

export async function updateReceiptFormatAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents/receipts");
  const jurisdiction = normalizeJurisdiction(field(formData, "jurisdiction"));
  const primaryColor = field(formData, "primary_color") || "#0F172A";
  const accentColor = field(formData, "accent_color") || "#1D4ED8";
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor) || !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    redirect(receiptBack("error", "Receipt colors must be six-digit hex colors."));
  }

  const { error } = await auth.admin.from("document_format_profiles").upsert(
    {
      document_type: "receipt",
      jurisdiction,
      format_name: field(formData, "format_name") || `${jurisdiction} receipt`,
      heading: field(formData, "heading") || "Official Payment Receipt",
      subheading: field(formData, "subheading") || "PAID - PAYMENT CONFIRMED",
      primary_color: primaryColor.toUpperCase(),
      accent_color: accentColor.toUpperCase(),
      font_family: ["serif", "sans"].includes(field(formData, "font_family"))
        ? field(formData, "font_family")
        : "sans",
      layout_style: ["classic", "modern", "compact"].includes(field(formData, "layout_style"))
        ? field(formData, "layout_style")
        : "classic",
      footer_text: field(formData, "footer_text") || "Thank you for your payment.",
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "document_type,jurisdiction" }
  );
  if (error) redirect(receiptBack("error", error.message));

  refresh();
  redirect(receiptBack("message", `${jurisdiction} receipt format saved for future receipts.`));
}

export async function approveWorkshopCertificateApplicationAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const applicationId = field(formData, "application_id");
  const adminNote = field(formData, "admin_note") || null;
  if (!applicationId) redirect(back("error", "Missing certificate application ID."));

  const { data: application } = await auth.admin
    .from("certificate_applications")
    .select("id,user_id,workshop_registration_id,workshop_id,preferred_name,status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application || application.status !== "pending") {
    redirect(back("error", "Only a pending certificate application can be approved."));
  }

  const [{ data: registration }, { data: workshop }, { data: template }] = await Promise.all([
    auth.admin.from("workshop_registrations").select("id,registration_status,attendance_status,document_jurisdiction").eq("id", application.workshop_registration_id).eq("user_id", application.user_id).maybeSingle(),
    auth.admin.from("workshops").select("id,title").eq("id", application.workshop_id).maybeSingle(),
    auth.admin.from("certificate_templates").select("*").eq("workshop_id", application.workshop_id).eq("is_active", true).maybeSingle(),
  ]);
  const registrationStatus = String(registration?.registration_status || "").toLowerCase();
  if (!registration || !["confirmed", "completed"].includes(registrationStatus)) {
    redirect(back("error", "The participant's workshop registration is not confirmed."));
  }
  if (String(registration.attendance_status).toLowerCase() !== "attended") {
    redirect(back("error", "Attendance is not confirmed in Registration Management."));
  }
  if (!workshop) redirect(back("error", "Workshop not found."));
  if (!template) redirect(back("error", "Upload and activate a certificate template for this workshop before approval."));

  const { data: documentId, error: prepareError } = await auth.admin.rpc(
    "prepare_completion_certificate",
    {
      p_user_id: application.user_id,
      p_source_type: "workshop_registration",
      p_source_id: application.workshop_registration_id,
      p_title: workshop.title,
      p_completed_at: new Date().toISOString(),
      p_jurisdiction: normalizeJurisdiction(registration.document_jurisdiction),
      p_metadata: {
        application_id: application.id,
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
        completion_source: "participant_application_admin_approval",
      },
    }
  );
  if (prepareError || !documentId) {
    redirect(back("error", prepareError?.message || "Certificate could not be prepared."));
  }

  const issuedAt = new Date().toISOString();
  const { error: issueError } = await auth.admin
    .from("official_documents")
    .update({
      recipient_name: cleanPreferredName(application.preferred_name),
      status: "issued",
      issued_at: issuedAt,
      issued_by: auth.user.id,
      updated_at: issuedAt,
      metadata: {
        application_id: application.id,
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
        completion_source: "participant_application_admin_approval",
      },
    })
    .eq("id", documentId);
  if (issueError) redirect(back("error", issueError.message));

  const { error: applicationError } = await auth.admin
    .from("certificate_applications")
    .update({
      status: "approved",
      admin_note: adminNote,
      reviewed_by: auth.user.id,
      reviewed_at: issuedAt,
      document_id: documentId,
      updated_at: issuedAt,
    })
    .eq("id", application.id)
    .eq("status", "pending");
  if (applicationError) redirect(back("error", applicationError.message));

  await auth.admin.from("internal_messages").insert({
    user_id: application.user_id,
    title: "Workshop certificate approved",
    body: `Your certificate application for ${workshop.title} was approved. The certificate is available under Certificates & Receipts.`,
    source_type: "certificate_application_approved",
    source_id: application.id,
  });

  refresh();
  redirect(back("message", "Certificate application approved and certificate released."));
}

export async function rejectWorkshopCertificateApplicationAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents");
  const applicationId = field(formData, "application_id");
  const adminNote = field(formData, "admin_note");
  if (!applicationId || adminNote.length < 5) {
    redirect(back("error", "A clear rejection note is required."));
  }

  const reviewedAt = new Date().toISOString();
  const { data: application, error } = await auth.admin
    .from("certificate_applications")
    .update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_by: auth.user.id,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("id,user_id,workshop_id")
    .maybeSingle();
  if (error || !application) redirect(back("error", error?.message || "Pending application not found."));

  const { data: workshop } = await auth.admin.from("workshops").select("title").eq("id", application.workshop_id).maybeSingle();
  await auth.admin.from("internal_messages").insert({
    user_id: application.user_id,
    title: "Certificate application needs attention",
    body: `Your certificate application${workshop?.title ? ` for ${workshop.title}` : ""} was not approved: ${adminNote}`,
    source_type: "certificate_application_rejected",
    source_id: application.id,
  });

  refresh();
  redirect(back("message", "Certificate application rejected with participant notification."));
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
