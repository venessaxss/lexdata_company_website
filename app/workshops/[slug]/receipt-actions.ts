"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function uploadReceiptAction(formData: FormData) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registrationId"));
  const receiptUrl = String(formData.get("receiptUrl"));
  const userNote = String(formData.get("userNote") || "");

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      user_note: userNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  revalidatePath("/workshops");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
}