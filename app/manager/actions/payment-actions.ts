"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updatePaymentAction(formData: FormData) {
  const admin = createAdminClient();

  const id = String(formData.get("id"));

  const registration_status = String(formData.get("registration_status"));
  const payment_status = String(formData.get("payment_status"));
  const payment_method = String(formData.get("payment_method"));
  const amount_received = Number(formData.get("amount_received"));
  const currency = String(formData.get("currency"));
  const reference = String(formData.get("reference"));
  const receipt_url = String(formData.get("receipt_url"));
  const payment_note = String(formData.get("payment_note"));

  await admin
    .from("workshop_registrations")
    .update({
      registration_status,
      payment_status,
      payment_method,
      amount_received,
      payment_currency: currency,
      transaction_reference: reference,
      receipt_url,
      payment_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/manager/registrations");
  revalidatePath("/manager/monitor");
  revalidatePath("/admin/registrations");

  // ❌ DO NOT return anything
}