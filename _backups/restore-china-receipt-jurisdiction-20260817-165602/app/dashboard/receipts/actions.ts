"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function result(key: "message" | "error", value: string) {
  return `/dashboard/receipts?${key}=${encodeURIComponent(value)}`;
}

export async function applyForWorkshopReceiptAction(formData: FormData) {
  const registrationId = field(formData, "registration_id");
  const recipientType = field(formData, "recipient_type");
  const recipientName = field(formData, "recipient_name");
  const registrationNumber = field(
    formData,
    "recipient_registration_number"
  );
  const recipientEmail = field(formData, "recipient_email");

  if (
    !registrationId ||
    !["personal", "company"].includes(recipientType) ||
    recipientName.length < 2 ||
    registrationNumber.length < 2 ||
    !recipientEmail
  ) {
    redirect(
      result(
        "error",
        "Complete the required recipient information."
      )
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: registration, error: registrationError } = await admin
    .from("workshop_registrations")
    .select(
      "id,user_id,workshop_id,payment_status,amount_received,payment_currency,document_jurisdiction"
    )
    .eq("id", registrationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (registrationError || !registration) {
    redirect(
      result(
        "error",
        "Workshop registration not found."
      )
    );
  }

  const paymentStatus = String(
    registration.payment_status || ""
  ).toLowerCase();

  if (!["confirmed", "paid"].includes(paymentStatus)) {
    redirect(
      result(
        "error",
        "Payment must be confirmed before a receipt can be requested."
      )
    );
  }

  const amount = Number(
    registration.amount_received || 0
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      result(
        "error",
        "The confirmed payment amount is missing. Ask the manager to reconfirm the payment."
      )
    );
  }

  const jurisdiction = String(
    registration.document_jurisdiction || ""
  ).toUpperCase();

  if (!["PK", "SA"].includes(jurisdiction)) {
    redirect(
      result(
        "error",
        "The receipt issuing entity is not configured as Pakistan or Saudi Arabia. Ask the manager to correct the registration issuer."
      )
    );
  }

  const { data: issuer } = await admin
    .from("document_issuer_profiles")
    .select("jurisdiction")
    .eq("jurisdiction", jurisdiction)
    .maybeSingle();

  if (!issuer) {
    redirect(
      result(
        "error",
        "The selected receipt issuing entity has not been configured by the administrator."
      )
    );
  }

  const { data: existingDocument } = await admin
    .from("official_documents")
    .select("id,status")
    .eq("document_type", "receipt")
    .eq("source_type", "workshop_registration")
    .eq("source_id", registration.id)
    .maybeSingle();

  if (existingDocument) {
    redirect(
      result(
        "error",
        "A receipt has already been generated for this payment."
      )
    );
  }

  const { data: existing } = await admin
    .from("receipt_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("workshop_registration_id", registration.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    redirect(
      result(
        "error",
        "This receipt application has already been approved."
      )
    );
  }

  if (existing?.status === "pending") {
    redirect(
      result(
        "error",
        "A receipt application is already awaiting review."
      )
    );
  }

  const payload = {
    user_id: user.id,
    workshop_registration_id: registration.id,
    workshop_id: registration.workshop_id,
    jurisdiction,
    recipient_type: recipientType,
    recipient_name: recipientName,
    recipient_registration_number: registrationNumber,
    recipient_tax_number:
      field(formData, "recipient_tax_number") || null,
    recipient_vat_number:
      field(formData, "recipient_vat_number") || null,
    recipient_email: recipientEmail,
    recipient_phone:
      field(formData, "recipient_phone") || null,
    recipient_address:
      field(formData, "recipient_address") || null,
    participant_note:
      field(formData, "participant_note") || null,
    status: "pending",
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };

  const operation = existing
    ? admin
        .from("receipt_applications")
        .update(payload)
        .eq("id", existing.id)
    : admin
        .from("receipt_applications")
        .insert(payload);

  const { error } = await operation;

  if (error) {
    redirect(
      result("error", error.message)
    );
  }

  revalidatePath("/dashboard/receipts");
  revalidatePath("/admin/documents/receipts");

  redirect(
    result(
      "message",
      "Receipt application submitted for admin review."
    )
  );
}