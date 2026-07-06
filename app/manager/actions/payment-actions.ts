"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updatePaymentAction(formData: FormData) {
  const admin = createAdminClient();

  const id = String(formData.get("id"));
  const payment_status = String(formData.get("payment_status"));

  const registration_status = String(formData.get("registration_status"));
  const amount_received = Number(formData.get("amount_received"));
  const currency = String(formData.get("currency"));
  const reference = String(formData.get("reference"));
  const receipt_url = String(formData.get("receipt_url"));
  const payment_note = String(formData.get("payment_note"));

  // update registration
  await admin
    .from("workshop_registrations")
    .update({
      registration_status,
      payment_status,
      amount_received,
      payment_currency: currency,
      transaction_reference: reference,
      receipt_url,
      payment_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // 🔥 AUTO UNLOCK ALL SESSIONS
  if (payment_status === "confirmed") {
    const { data: reg } = await admin
      .from("workshop_registrations")
      .select("user_id, workshop_id")
      .eq("id", id)
      .single();

    const { data: sessions } = await admin
      .from("workshop_sessions")
      .select("id")
      .eq("workshop_id", reg.workshop_id);

    if (sessions) {
      await admin.from("session_access_logs").insert(
        sessions.map((s: any) => ({
          user_id: reg.user_id,
          session_id: s.id,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        }))
      );
    }
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/manager/monitor");
  revalidatePath("/workshops");
}