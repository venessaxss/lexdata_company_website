"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";

type ActionUserProfile = {
  id: string;
  role?: string | null;
};

async function requirePaymentManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role);

  if (!profile || (role !== "admin" && role !== "manager")) {
    redirect("/dashboard");
  }

  return {
    id: profile.id,
    role,
  } as ActionUserProfile;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildPaymentInstructionMessage({
  workshopTitle,
  paymentMethod,
  paymentLink,
  paymentNote,
  paymentCurrency,
  amount,
}: {
  workshopTitle: string;
  paymentMethod?: string | null;
  paymentLink?: string | null;
  paymentNote?: string | null;
  paymentCurrency: string;
  amount: number;
}) {
  const parts = [
    `Your registration for ${workshopTitle} has been reviewed.`,
    "",
    "Please follow the payment instructions below.",
    paymentMethod ? `Payment method: ${paymentMethod}` : null,
    amount > 0 ? `Amount: ${paymentCurrency} ${amount}` : null,
    paymentLink ? `Payment instruction/link: ${paymentLink}` : null,
    paymentNote ? `Note: ${paymentNote}` : null,
    "",
    "After completing payment, please send your payment reference or receipt information to the LexData team.",
  ].filter(Boolean);

  return parts.join("\n");
}

export async function updateWorkshopRegistration(formData: FormData) {
  const actor = await requirePaymentManager();

  const supabase = createAdminClient();

  const id = field(formData, "id");
  const backTo = field(formData, "back_to") || "/admin/registrations";
  const actionType = field(formData, "action_type") || "save";

  if (!id) {
    redirect(`${backTo}?message=Missing registration ID`);
  }

  const { data: existingRegistration, error: existingError } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops:workshop_id (
        title,
        slug
      )
    `
    )
    .eq("id", id)
    .single();

  if (existingError || !existingRegistration) {
    redirect(
      `${backTo}?message=${encodeURIComponent(
        existingError?.message || "Registration not found"
      )}`
    );
  }

  let status =
    field(formData, "status") || existingRegistration.status || "pending";

  let paymentStatus =
    field(formData, "payment_status") ||
    existingRegistration.payment_status ||
    "pending";

  const paymentMethod = nullableField(formData, "payment_method");
  const paymentReference = nullableField(formData, "payment_reference");
  const paymentNote = nullableField(formData, "payment_note");
  const paymentLink = nullableField(formData, "payment_link");
  const adminNote = nullableField(formData, "admin_note");
  const receiptUrl = nullableField(formData, "receipt_url");

  const amount = numberField(formData, "amount_received", 0);
  const paymentCurrency = field(formData, "payment_currency") || "USD";

  if (actionType === "send_payment_info") {
    status = status === "pending" ? "approved" : status;
    paymentStatus = "instructions_sent";
  }

  if (actionType === "record_payment_received") {
    status = status === "pending" ? "approved" : status;
    paymentStatus = "under_review";
  }

  if (actionType === "confirm_payment") {
    status = "confirmed";
    paymentStatus = "confirmed";
  }

  if (actionType === "waive_payment") {
    status = "confirmed";
    paymentStatus = "waived";
  }

  const shouldConfirmPayment =
    paymentStatus === "confirmed" ||
    paymentStatus === "paid" ||
    paymentStatus === "waived";

  const { error: paymentRecordError } = await supabase
    .from("workshop_payment_records")
    .insert({
      registration_id: id,
      workshop_id: existingRegistration.workshop_id,
      user_id: existingRegistration.user_id,

      action_type: actionType,
      payment_status: paymentStatus,

      payment_method: paymentMethod,
      payment_reference: paymentReference,
      payment_note: paymentNote,
      admin_note: adminNote,
      receipt_url: receiptUrl,
      payment_link: paymentLink,

      amount,
      currency: paymentCurrency,

      recorded_by: actor.id,
      recorded_role: actor.role,

      created_at: new Date().toISOString(),
    });

  if (paymentRecordError) {
    redirect(
      `${backTo}?message=${encodeURIComponent(paymentRecordError.message)}`
    );
  }

  const updatePayload: Record<string, unknown> = {
    status,
    payment_status: paymentStatus,

    payment_method: paymentMethod,
    payment_reference: paymentReference,
    payment_note: paymentNote,
    payment_link: paymentLink,
    admin_note: adminNote,
    receipt_url: receiptUrl,

    amount_received: amount,
    payment_currency: paymentCurrency,

    updated_at: new Date().toISOString(),
  };

  if (shouldConfirmPayment) {
    updatePayload.payment_confirmed_at = new Date().toISOString();
    updatePayload.payment_confirmed_by = actor.id;
  }

  const { data: registration, error } = await supabase
    .from("workshop_registrations")
    .update(updatePayload)
    .eq("id", id)
    .select(
      `
      *,
      workshops:workshop_id (
        title,
        slug
      )
    `
    )
    .single();

  if (error) {
    redirect(`${backTo}?message=${encodeURIComponent(error.message)}`);
  }

  const userId = registration?.user_id as string | null | undefined;

  const workshopTitle =
    registration?.workshops?.title ||
    registration?.workshop_title ||
    "Workshop";

  const workshopSlug =
    registration?.workshops?.slug || registration?.workshop_slug || "";

  if (userId && actionType === "send_payment_info") {
    await supabase.from("user_messages").insert({
      user_id: userId,
      sender_id: actor.id,
      sender_role: actor.role,
      target_role: "member",
      message_type: "payment_instructions",
      title: "Payment instructions",
      body: buildPaymentInstructionMessage({
        workshopTitle,
        paymentMethod,
        paymentLink,
        paymentNote,
        paymentCurrency,
        amount,
      }),
      link_url:
        paymentLink || (workshopSlug ? `/workshops/${workshopSlug}` : null),
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (userId && actionType === "record_payment_received") {
    const bodyParts = [
      `Your payment information for ${workshopTitle} has been received and is now under review.`,
      paymentMethod ? `Payment method: ${paymentMethod}` : null,
      paymentReference ? `Reference: ${paymentReference}` : null,
      amount > 0 ? `Amount received: ${paymentCurrency} ${amount}` : null,
      receiptUrl ? `Receipt/link: ${receiptUrl}` : null,
      paymentNote ? `Note: ${paymentNote}` : null,
    ].filter(Boolean);

    await supabase.from("user_messages").insert({
      user_id: userId,
      sender_id: actor.id,
      sender_role: actor.role,
      target_role: "member",
      message_type: "payment_received",
      title: "Payment information received",
      body: bodyParts.join("\n"),
      link_url: workshopSlug
        ? `/workshops/${workshopSlug}`
        : "/dashboard/my-learning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (userId && actionType === "confirm_payment") {
    await supabase.from("user_messages").insert({
      user_id: userId,
      sender_id: actor.id,
      sender_role: actor.role,
      target_role: "member",
      message_type: "payment_confirmed",
      title: "Workshop access confirmed",
      body: `Your registration for ${workshopTitle} has been confirmed. You can now access the available workshop sessions, subsessions, materials, and links from your dashboard.`,
      link_url: workshopSlug
        ? `/workshops/${workshopSlug}`
        : "/dashboard/my-learning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (userId && actionType === "waive_payment") {
    await supabase.from("user_messages").insert({
      user_id: userId,
      sender_id: actor.id,
      sender_role: actor.role,
      target_role: "member",
      message_type: "access_confirmed",
      title: "Workshop access confirmed",
      body: `Your access for ${workshopTitle} has been approved by the LexData team.`,
      link_url: workshopSlug
        ? `/workshops/${workshopSlug}`
        : "/dashboard/my-learning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/workshops");

  if (workshopSlug) {
    revalidatePath(`/workshops/${workshopSlug}`);
  }

  if (actionType === "send_payment_info") {
    redirect(`${backTo}?message=Payment instructions sent and synced`);
  }

  if (actionType === "record_payment_received") {
    redirect(`${backTo}?message=Payment record saved and synced`);
  }

  if (actionType === "confirm_payment") {
    redirect(`${backTo}?message=Payment confirmed, synced, and access unlocked`);
  }

  if (actionType === "waive_payment") {
    redirect(`${backTo}?message=Payment waived and access unlocked`);
  }

  redirect(`${backTo}?message=Registration payment information saved and synced`);
}