"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function uploadReceiptAction({
  registrationId,
  receiptUrl,
  slug,
}: {
  registrationId: string;
  receiptUrl: string;
  slug: string;
}) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/manager/monitor");
  revalidatePath("/admin/registrations");
}