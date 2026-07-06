"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function uploadReceiptAction(formData: FormData) {
  const admin = createAdminClient();

  const registrationId = String(formData.get("registrationId"));
  const receiptUrl = String(formData.get("receiptUrl"));
  const slug = String(formData.get("slug"));

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
}