"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateWorkshopRegistrationPaymentAction(
  formData: FormData
) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registration_id") || "");
  const paymentStatus = String(formData.get("payment_status") || "pending");
  const amountReceived = Number(formData.get("amount_received") || 0);
  const paymentCurrency = String(formData.get("payment_currency") || "USD");
  const paymentNote = String(formData.get("payment_note") || "");

  if (!registrationId) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (!registration) return;

  const registrationStatus =
    paymentStatus === "confirmed" || paymentStatus === "waived"
      ? "confirmed"
      : "pending";

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: registrationStatus,
      payment_status: paymentStatus,
      amount_received: Number.isFinite(amountReceived) ? amountReceived : 0,
      payment_currency: paymentCurrency,
      payment_note: paymentNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  const { data: workshop } = await admin
    .from("workshops")
    .select("slug")
    .eq("id", registration.workshop_id)
    .maybeSingle();

  if (workshop?.slug) {
    revalidatePath(`/workshops/${workshop.slug}`);
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/dashboard/my-learning");
}

export const updatePaymentAction = updateWorkshopRegistrationPaymentAction;
export const updateWorkshopRegistration = updateWorkshopRegistrationPaymentAction;