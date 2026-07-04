"use server";

import { Buffer } from "buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RECEIPT_BUCKET = "payment-receipts";

function cleanRedirectMessage(message: string) {
  return encodeURIComponent(message);
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadPaymentReceiptAction(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const registrationId = String(formData.get("registration_id") || "").trim();
  const receipt = formData.get("receipt") as File | null;

  if (!slug) {
    redirect("/workshops");
  }

  if (!registrationId) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Missing registration information"
      )}`
    );
  }

  if (!receipt || receipt.size === 0) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Please choose a receipt file"
      )}`
    );
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (receipt.type && !allowedTypes.includes(receipt.type)) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Please upload a PDF or image receipt"
      )}`
    );
  }

  if (receipt.size > 10 * 1024 * 1024) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Receipt file must be under 10MB"
      )}`
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/workshops/${slug}`);
  }

  const admin = createAdminClient();

  const { data: registration, error: registrationError } = await admin
    .from("workshop_registrations")
    .select(
      `
      id,
      user_id,
      workshop_id,
      registration_status,
      payment_status,
      payment_currency,
      amount_received
    `
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (registrationError || !registration) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Registration was not found"
      )}`
    );
  }

  if (registration.user_id !== user.id) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "You cannot upload a receipt for this registration"
      )}`
    );
  }

  if (
    registration.registration_status === "cancelled" ||
    registration.registration_status === "rejected"
  ) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Receipt upload is not available for this registration"
      )}`
    );
  }

  if (
    registration.payment_status === "confirmed" ||
    registration.payment_status === "waived"
  ) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Payment is already confirmed"
      )}`
    );
  }

  const safeFileName = sanitizeFileName(receipt.name || "receipt");

  const storagePath = `${user.id}/${registrationId}/${Date.now()}-${safeFileName}`;

  const arrayBuffer = await receipt.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from(RECEIPT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: receipt.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Could not upload receipt"
      )}`
    );
  }

  const { data: publicUrlData } = admin.storage
    .from(RECEIPT_BUCKET)
    .getPublicUrl(storagePath);

  const receiptUrl = publicUrlData.publicUrl;

  await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      payment_note: "Receipt uploaded by member",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  await admin.from("workshop_payment_records").insert({
    registration_id: registration.id,
    workshop_id: registration.workshop_id,
    user_id: registration.user_id,
    action_type: "member_receipt_upload",
    payment_status: "under_review",
    payment_note: "Receipt uploaded by member",
    receipt_url: receiptUrl,
    amount: registration.amount_received || 0,
    currency: registration.payment_currency || "USD",
    created_at: new Date().toISOString(),
  });

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");

  redirect(
    `/workshops/${slug}?message=${cleanRedirectMessage(
      "Payment receipt uploaded. We will review it soon."
    )}`
  );
}