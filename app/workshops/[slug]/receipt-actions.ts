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
  const workshopIdFromForm = String(formData.get("workshop_id") || "").trim();
  const receipt = formData.get("receipt") as File | null;

  if (!slug) {
    redirect("/workshops");
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

  let workshopId = workshopIdFromForm;

  if (!workshopId) {
    const { data: workshop, error: workshopError } = await admin
      .from("workshops")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (workshopError || !workshop) {
      redirect(
        `/workshops/${slug}?message=${cleanRedirectMessage(
          "Workshop was not found"
        )}`
      );
    }

    workshopId = workshop.id;
  }

  let registration: {
    id: string;
    user_id: string;
    workshop_id: string;
    registration_status?: string | null;
    payment_status?: string | null;
    payment_currency?: string | null;
    amount_received?: number | null;
  } | null = null;

  if (registrationId) {
    const { data: registrationById } = await admin
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
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationById;
  }

  if (!registration) {
    const { data: registrationByWorkshop } = await admin
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
      .eq("workshop_id", workshopId)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationByWorkshop;
  }

  if (!registration) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Registration was not found. Please refresh the page and try again."
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
  const storagePath = `${user.id}/${registration.id}/${Date.now()}-${safeFileName}`;

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
        `Could not upload receipt: ${uploadError.message}`
      )}`
    );
  }

  const { data: publicUrlData } = admin.storage
    .from(RECEIPT_BUCKET)
    .getPublicUrl(storagePath);

  const receiptUrl = publicUrlData.publicUrl;

  const { error: updateError } = await admin
    .from("workshop_registrations")
    .update({
      receipt_url: receiptUrl,
      payment_status: "under_review",
      payment_note: "Receipt uploaded by member",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registration.id);

  if (updateError) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        `Receipt uploaded, but registration update failed: ${updateError.message}`
      )}`
    );
  }

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