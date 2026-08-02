"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function uploadReceiptAction(formData: FormData) {
  const registrationId = String(formData.get("registrationId") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
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
    .select("id, user_id, email")
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

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: publicUrlData.publicUrl,
      payment_status: "under_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  await admin.from("internal_messages").insert({
    user_id: registration.user_id,
    recipient_email: registration.email,
    title: "Payment receipt uploaded",
    body: "Your receipt was uploaded successfully and is now under review.",
    source_type: "payment_receipt_uploaded",
    source_id: registrationId,
  });

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
}