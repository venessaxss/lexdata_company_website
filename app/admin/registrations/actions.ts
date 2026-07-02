"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile as ActionUserProfile;
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
  amountReceived,
}: {
  workshopTitle: string;
  paymentMethod?: string | null;
  paymentLink?: string | null;
  paymentNote?: string | null;
  paymentCurrency: string;
  amountReceived: number;
}) {
  const parts = [
    `Your registration for ${workshopTitle} has been reviewed.`,
    "",
    "Please follow the payment instructions below.",
    paymentMethod ? `Payment method: ${paymentMethod}` : null,
    amountReceived > 0 ? `Amount: ${paymentCurrency} ${amountReceived}` : null,
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

  let status = field(formData, "status") || "pending";
  let paymentStatus = field(formData, "payment_status") || "pending";

  const paymentMethod = nullableField(formData, "payment_method");
  const paymentReference = nullableField(formData, "payment_reference");
  const paymentNote = nullableField(formData, "payment_note");
  const paymentLink = nullableField(formData, "payment_link");
  const adminNote = nullableField(formData, "admin_note");
  const amountReceived = numberField(formData, "amount_received", 0);
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

  const shouldConfirmPayment =
    paymentStatus === "confirmed" || paymentStatus === "paid";

  const updatePayload: Record<string, unknown> = {
    status,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    payment_note: paymentNote,
    payment_link: paymentLink,
    admin_note: adminNote,
    amount_received: amountReceived,
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
        amountReceived,
      }),
      link_url: paymentLink || (workshopSlug ? `/workshops/${workshopSlug}` : null),
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (userId && actionType === "record_payment_received") {
    const bodyParts = [
      `Your payment information for ${workshopTitle} has been received and is now under review.`,
      paymentMethod ? `Payment method: ${paymentMethod}` : null,
      paymentReference ? `Reference: ${paymentReference}` : null,
      amountReceived > 0 ? `Amount received: ${paymentCurrency} ${amountReceived}` : null,
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
      link_url: workshopSlug ? `/workshops/${workshopSlug}` : "/dashboard/my-learning",
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
      link_url: workshopSlug ? `/workshops/${workshopSlug}` : "/dashboard/my-learning",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (userId && paymentStatus === "waived") {
    await supabase.from("user_messages").insert({
      user_id: userId,
      sender_id: actor.id,
      sender_role: actor.role,
      target_role: "member",
      message_type: "access_confirmed",
      title: "Workshop access confirmed",
      body: `Your access for ${workshopTitle} has been approved by the LexData team.`,
      link_url: workshopSlug ? `/workshops/${workshopSlug}` : "/dashboard/my-learning",
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
    redirect(`${backTo}?message=Payment instructions sent to member`);
  }

  if (actionType === "record_payment_received") {
    redirect(`${backTo}?message=Payment information recorded and member notified`);
  }

  if (actionType === "confirm_payment") {
    redirect(`${backTo}?message=Payment confirmed and access unlocked`);
  }

  redirect(`${backTo}?message=Registration payment information saved`);
}