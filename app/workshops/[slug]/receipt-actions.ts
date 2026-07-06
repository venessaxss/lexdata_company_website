"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWorkshopNotification } from "@/lib/workshop-notifications";

export async function uploadReceiptAction(formData: FormData) {
  const registrationId = String(formData.get("registrationId") || "");
  const workshopSlug = String(formData.get("slug") || "");
  const file = formData.get("receipt") as File | null;

  if (!registrationId || !file || file.size === 0) return;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("id, user_id, email, full_name")
    .eq("id", registrationId)
    .maybeSingle();

  if (!registration || registration.user_id !== user.id) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${registrationId}-${Date.now()}-${safeName}`;

  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("payment-receipts")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) return;

  const { data: publicUrlData } = admin.storage
    .from("payment-receipts")
    .getPublicUrl(path);

  const receiptUrl = publicUrlData.publicUrl;

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  await sendWorkshopNotification({
    userId: registration.user_id,
    email: registration.email,
    title: "Payment receipt received",
    body: "Your payment receipt has been uploaded successfully and is now under review.",
    sourceType: "payment_receipt_uploaded",
    sourceId: registrationId,
  });

  revalidatePath(`/workshops/${workshopSlug}`);
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
}