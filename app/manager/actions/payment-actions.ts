"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

async function createInternalMessage(input: {
  userId?: string | null;
  email?: string | null;
  title: string;
  body: string;
  sourceType: string;
  sourceId: string;
}) {
  const admin = createAdminClient();

  await admin.from("internal_messages").insert({
    user_id: input.userId || null,
    recipient_email: input.email || null,
    title: input.title,
    body: input.body,
    source_type: input.sourceType,
    source_id: input.sourceId,
  });

  if (!input.email || !process.env.RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "LexData <noreply@lexdataai.com>",
      to: input.email,
      subject: input.title,
      text: input.body,
    }),
  });
}

async function revalidateRegistrationPages(workshopId?: string | null) {
  const admin = createAdminClient();

  if (workshopId) {
    const { data: workshop } = await admin
      .from("workshops")
      .select("slug")
      .eq("id", workshopId)
      .maybeSingle();

    if (workshop?.slug) {
      revalidatePath(`/workshops/${workshop.slug}`);
    }
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
  revalidatePath("/admin");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/dashboard/messages");
  revalidatePath("/my/workshops");
}

export async function sendPaymentInstructionsAction(formData: FormData) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registration_id") || "").trim();
  const paymentLink = String(formData.get("payment_link") || "").trim();
  const paymentNote = String(formData.get("payment_note") || "").trim();

  if (!registrationId) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("id, user_id, email, full_name, workshop_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (!registration) return;

  await admin
    .from("workshop_registrations")
    .update({
      payment_status: "instructions_sent",
      payment_link: paymentLink || null,
      payment_note: paymentNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  await createInternalMessage({
    userId: registration.user_id,
    email: registration.email,
    title: "Payment instructions sent",
    body:
      paymentNote ||
      "Payment instructions have been sent for your workshop registration. Please complete payment and upload your receipt.",
    sourceType: "payment_instructions",
    sourceId: registrationId,
  });

  await revalidateRegistrationPages(registration.workshop_id);
}

export async function updateWorkshopRegistrationPaymentAction(
  formData: FormData
) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registration_id") || "").trim();
  const paymentStatus = String(formData.get("payment_status") || "pending");
  const amountReceived = Number(formData.get("amount_received") || 0);
  const paymentCurrency = String(formData.get("payment_currency") || "USD");
  const paymentNote = String(formData.get("payment_note") || "").trim();

  if (!registrationId) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("id, user_id, email, full_name, workshop_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (!registration) return;

  const registrationStatus =
    paymentStatus === "confirmed" || paymentStatus === "waived"
      ? "confirmed"
      : paymentStatus === "rejected"
        ? "rejected"
        : "pending";

  const safeAmount =
    paymentStatus === "confirmed" && Number.isFinite(amountReceived)
      ? amountReceived
      : paymentStatus === "waived"
        ? 0
        : Number.isFinite(amountReceived)
          ? amountReceived
          : 0;

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: registrationStatus,
      payment_status: paymentStatus,
      amount_received: safeAmount,
      payment_currency: paymentCurrency || "USD",
      payment_note: paymentNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  await createInternalMessage({
    userId: registration.user_id,
    email: registration.email,
    title:
      paymentStatus === "confirmed"
        ? "Payment confirmed"
        : paymentStatus === "rejected"
          ? "Payment rejected"
          : "Payment status updated",
    body:
      paymentStatus === "confirmed"
        ? "Your payment has been confirmed. Your workshop access is now unlocked."
        : paymentStatus === "waived"
          ? "Your workshop payment has been waived. Your access is now unlocked."
          : paymentNote || `Your payment status is now: ${paymentStatus}.`,
    sourceType: "payment_status_updated",
    sourceId: registrationId,
  });

  await revalidateRegistrationPages(registration.workshop_id);
}

export const updatePaymentAction = updateWorkshopRegistrationPaymentAction;
export const updateWorkshopRegistration = updateWorkshopRegistrationPaymentAction;