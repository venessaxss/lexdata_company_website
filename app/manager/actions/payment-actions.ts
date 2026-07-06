"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateWorkshopRegistrationPaymentAction(formData: FormData) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registration_id") || "");
  const paymentStatus = String(formData.get("payment_status") || "pending");
  const amountReceived = Number(formData.get("amount_received") || 0);
  const paymentCurrency = String(formData.get("payment_currency") || "USD");
  const paymentNote = String(formData.get("payment_note") || "");

  if (!registrationId) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("id, workshop_id, user_id, workshops(slug)")
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

  const workshop = registration.workshops as any;
  const slug = Array.isArray(workshop) ? workshop[0]?.slug : workshop?.slug;

  if (slug) {
    revalidatePath(`/workshops/${slug}`);
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/admin/registrations");
}

// Keep old imports working if your files already use these names.
export const updatePaymentAction = updateWorkshopRegistrationPaymentAction;
export const updateWorkshopRegistration = updateWorkshopRegistrationPaymentAction;