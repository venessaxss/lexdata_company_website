"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  cleanPreferredName,
  normalizeJurisdiction,
} from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(key: "message" | "error", value: string) {
  return `/admin/documents/receipts?${key}=${encodeURIComponent(value)}`;
}

function refresh() {
  revalidatePath("/admin/documents/receipts");
  revalidatePath("/dashboard/receipts");
  revalidatePath("/dashboard/documents");
}

export async function approveReceiptApplicationAction(
  formData: FormData
) {
  const auth = await requireAdmin("/admin/documents/receipts");

  const applicationId = field(formData, "application_id");
  const adminNote = field(formData, "admin_note") || null;
  const authorityReference =
    field(formData, "authority_reference") || null;
  const externalInvoiceUrl =
    field(formData, "external_invoice_url") || null;
  const markTaxDocument =
    field(formData, "is_tax_document") === "yes";

  if (!applicationId) {
    redirect(back("error", "Missing receipt application ID."));
  }

  if (markTaxDocument && !authorityReference) {
    redirect(
      back(
        "error",
        "An authority reference is required before a receipt can be marked as a tax document."
      )
    );
  }

  const { data: application } = await auth.admin
    .from("receipt_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.status !== "pending") {
    redirect(
      back(
        "error",
        "Only a pending receipt application can be approved."
      )
    );
  }

  const [
    registrationResult,
    workshopResult,
    issuerResult,
    formatResult,
  ] = await Promise.all([
    auth.admin
      .from("workshop_registrations")
      .select(
        "id,user_id,workshop_id,payment_status,amount_received,payment_currency,document_jurisdiction"
      )
      .eq("id", application.workshop_registration_id)
      .eq("user_id", application.user_id)
      .maybeSingle(),

    auth.admin
      .from("workshops")
      .select("id,title")
      .eq("id", application.workshop_id)
      .maybeSingle(),

    auth.admin
      .from("document_issuer_profiles")
      .select("*")
      .eq("jurisdiction", application.jurisdiction)
      .maybeSingle(),

    auth.admin
      .from("document_format_profiles")
      .select("*")
      .eq("document_type", "receipt")
      .eq("jurisdiction", application.jurisdiction)
      .maybeSingle(),
  ]);

  const registration = registrationResult.data;
  const workshop = workshopResult.data;
  const issuer = issuerResult.data;
  const receiptFormat = formatResult.data;

  if (!registration || !workshop) {
    redirect(
      back(
        "error",
        "The source workshop registration could not be found."
      )
    );
  }

  if (
    !["confirmed", "paid"].includes(
      String(registration.payment_status || "").toLowerCase()
    )
  ) {
    redirect(back("error", "Payment is not confirmed."));
  }

  const amount = Number(registration.amount_received || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      back("error", "The confirmed payment amount is invalid.")
    );
  }

  const registrationJurisdiction = String(
    registration.document_jurisdiction || ""
  ).toUpperCase();

  if (!["PK", "SA"].includes(registrationJurisdiction)) {
    redirect(
      back(
        "error",
        "The source registration does not have a valid Pakistan or Saudi Arabia receipt issuer."
      )
    );
  }

  if (
    registrationJurisdiction !==
    String(application.jurisdiction || "").toUpperCase()
  ) {
    redirect(
      back(
        "error",
        "Receipt issuer mismatch detected. Ask the participant to reapply after the registration issuer is corrected."
      )
    );
  }

  const jurisdiction = normalizeJurisdiction(
    registrationJurisdiction
  );

  const { data: documentId, error: issueError } =
    await auth.admin.rpc("issue_confirmed_payment_receipt", {
      p_user_id: application.user_id,
      p_source_type: "workshop_registration",
      p_source_id: registration.id,
      p_title: workshop.title,
      p_amount: amount,
      p_currency: registration.payment_currency || "USD",
      p_confirmed_at: new Date().toISOString(),
      p_jurisdiction: jurisdiction,
      p_metadata: {
        receipt_application_id: application.id,
        recipient_type: application.recipient_type,
        recipient_registration_number:
          application.recipient_registration_number,
        recipient_tax_number: application.recipient_tax_number,
        recipient_vat_number: application.recipient_vat_number,
        recipient_address: application.recipient_address,
        recipient_phone: application.recipient_phone,
        participant_note: application.participant_note,
        issuance_source:
          "participant_receipt_application_admin_approval",
      },
    });

  if (issueError || !documentId) {
    redirect(
      back(
        "error",
        issueError?.message || "Receipt could not be generated."
      )
    );
  }

  const { data: currentDocument } = await auth.admin
    .from("official_documents")
    .select("metadata")
    .eq("id", documentId)
    .maybeSingle();

  const metadata = {
    ...(currentDocument?.metadata || {}),
    receipt_application_id: application.id,
    recipient_type: application.recipient_type,
    recipient_registration_number:
      application.recipient_registration_number,
    recipient_tax_number: application.recipient_tax_number,
    recipient_vat_number: application.recipient_vat_number,
    recipient_address: application.recipient_address,
    recipient_phone: application.recipient_phone,
    participant_note: application.participant_note,
    receipt_format: receiptFormat
      ? {
          document_type: receiptFormat.document_type,
          jurisdiction: receiptFormat.jurisdiction,
          format_name: receiptFormat.format_name,
          heading: receiptFormat.heading,
          subheading: receiptFormat.subheading,
          primary_color: receiptFormat.primary_color,
          accent_color: receiptFormat.accent_color,
          font_family: receiptFormat.font_family,
          layout_style: receiptFormat.layout_style,
          footer_text: receiptFormat.footer_text,
          show_issuer_address: receiptFormat.show_issuer_address,
          show_tax_id: receiptFormat.show_tax_id,
        }
      : currentDocument?.metadata?.receipt_format || {},
    issuance_source:
      "participant_receipt_application_admin_approval",
  };

  const issuedAt = new Date().toISOString();

  const { error: documentError } = await auth.admin
    .from("official_documents")
    .update({
      jurisdiction,
      recipient_name: cleanPreferredName(application.recipient_name),
      recipient_email: application.recipient_email,
      status: "issued",
      issued_at: issuedAt,
      issued_by: auth.user.id,
      is_tax_document: markTaxDocument,
      authority_reference: authorityReference,
      external_invoice_url: externalInvoiceUrl,
      issuer_snapshot: issuer || {},
      metadata,
      updated_at: issuedAt,
    })
    .eq("id", documentId);

  if (documentError) {
    redirect(back("error", documentError.message));
  }

  const { error: applicationError } = await auth.admin
    .from("receipt_applications")
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

  if (applicationError) {
    redirect(back("error", applicationError.message));
  }

  await auth.admin.from("internal_messages").insert({
    user_id: application.user_id,
    title: "Receipt application approved",
    body:
      `Your receipt request for ${workshop.title} was approved. ` +
      "The receipt is now available in your Receipt workspace.",
    source_type: "receipt_application_approved",
    source_id: application.id,
  });

  refresh();

  redirect(
    back(
      "message",
      "Receipt application approved and receipt issued."
    )
  );
}

export async function rejectReceiptApplicationAction(
  formData: FormData
) {
  const auth = await requireAdmin("/admin/documents/receipts");

  const applicationId = field(formData, "application_id");
  const adminNote = field(formData, "admin_note");

  if (!applicationId || adminNote.length < 5) {
    redirect(back("error", "A clear rejection note is required."));
  }

  const reviewedAt = new Date().toISOString();

  const { data: application, error } = await auth.admin
    .from("receipt_applications")
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

  if (error || !application) {
    redirect(
      back(
        "error",
        error?.message || "Receipt application could not be rejected."
      )
    );
  }

  const { data: workshop } = await auth.admin
    .from("workshops")
    .select("title")
    .eq("id", application.workshop_id)
    .maybeSingle();

  await auth.admin.from("internal_messages").insert({
    user_id: application.user_id,
    title: "Receipt application needs attention",
    body:
      `Your receipt application${
        workshop?.title ? ` for ${workshop.title}` : ""
      } was not approved: ${adminNote}`,
    source_type: "receipt_application_rejected",
    source_id: application.id,
  });

  refresh();

  redirect(back("message", "Receipt application rejected."));
}
