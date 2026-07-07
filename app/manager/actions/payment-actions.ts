"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

async function notifyUser(input: {
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
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/my/workshops");
}

export async function handleRegistrationManagementAction(formData: FormData) {
  const admin = createAdminClient();

  const intent = String(formData.get("intent") || "").trim();
  const registrationId = String(formData.get("registration_id") || "").trim();

  const registrationStatus = String(
    formData.get("registration_status") || "pending"
  );

  const paymentStatus = String(formData.get("payment_status") || "pending");
  const paymentLink = String(formData.get("payment_link") || "").trim();
  const paymentNote = String(formData.get("payment_note") || "").trim();
  const paymentCurrency = String(formData.get("payment_currency") || "USD");
  const amountReceived = Number(formData.get("amount_received") || 0);

  if (!registrationId) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("id, user_id, email, full_name, workshop_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (!registration) return;

  if (intent === "save_statuses") {
    await admin
      .from("workshop_registrations")
      .update({
        registration_status: registrationStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await revalidateRegistrationPages(registration.workshop_id);
    return;
  }

  if (intent === "send_payment_message") {
    const messageBody =
      paymentNote ||
      (paymentLink
        ? `Payment instructions have been sent. Please complete payment using this link: ${paymentLink}`
        : "Payment instructions have been sent. Please complete payment and upload your receipt.");

    await admin
      .from("workshop_registrations")
      .update({
        registration_status: "pending",
        payment_status: "instructions_sent",
        payment_link: paymentLink || null,
        payment_note: paymentNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Payment instructions sent",
      body: messageBody,
      sourceType: "payment_instructions",
      sourceId: registrationId,
    });
  }

  if (intent === "record_payment_received") {
    await admin
      .from("workshop_registrations")
      .update({
        registration_status: "pending",
        payment_status: "under_review",
        amount_received: Number.isFinite(amountReceived) ? amountReceived : 0,
        payment_currency: paymentCurrency || "USD",
        payment_note: paymentNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Payment information received",
      body: "Your payment information has been recorded and is now under review.",
      sourceType: "payment_received",
      sourceId: registrationId,
    });
  }

  if (intent === "confirm_payment") {
    await admin
      .from("workshop_registrations")
      .update({
        registration_status: "confirmed",
        payment_status: "confirmed",
        amount_received: Number.isFinite(amountReceived) ? amountReceived : 0,
        payment_currency: paymentCurrency || "USD",
        payment_note: paymentNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Payment confirmed",
      body: "Your payment has been confirmed. Your workshop access is now unlocked.",
      sourceType: "payment_confirmed",
      sourceId: registrationId,
    });
  }

  if (intent === "waive_payment") {
    await admin
      .from("workshop_registrations")
      .update({
        registration_status: "confirmed",
        payment_status: "waived",
        amount_received: 0,
        payment_note: paymentNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    await notifyUser({
      userId: registration.user_id,
      email: registration.email,
      title: "Workshop access unlocked",
      body: "Your payment has been waived. Your workshop access is now unlocked.",
      sourceType: "payment_waived",
      sourceId: registrationId,
    });
  }

  await revalidateRegistrationPages(registration.workshop_id);
}

export const sendPaymentInstructionsAction = handleRegistrationManagementAction;
export const updateWorkshopRegistrationPaymentAction =
  handleRegistrationManagementAction;
export const updatePaymentAction = handleRegistrationManagementAction;
export const updateWorkshopRegistration = handleRegistrationManagementAction;