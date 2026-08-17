"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanPreferredName } from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function result(key: "message" | "error", value: string) {
  return `/dashboard/documents?${key}=${encodeURIComponent(value)}`;
}

export async function applyForWorkshopCertificateAction(formData: FormData) {
  const registrationId = field(formData, "registration_id");
  const preferredName = cleanPreferredName(field(formData, "preferred_name"));
  const participantNote = field(formData, "participant_note") || null;

  if (!registrationId || preferredName.length < 2) {
    redirect(result("error", "Select an eligible workshop and enter your preferred certificate name."));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: registration, error: registrationError } = await admin
    .from("workshop_registrations")
    .select("id,user_id,workshop_id,registration_status,attendance_status")
    .eq("id", registrationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (registrationError || !registration) {
    redirect(result("error", "Workshop registration not found."));
  }
  const registrationStatus = String(registration.registration_status).toLowerCase();
  if (!["confirmed", "completed"].includes(registrationStatus)) {
    redirect(result("error", "The admin must confirm your workshop registration before you can apply."));
  }
  if (String(registration.attendance_status).toLowerCase() !== "attended") {
    redirect(result("error", "The admin must confirm your attendance in Registration Management before you can apply."));
  }

  const { data: existing } = await admin
    .from("certificate_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("workshop_registration_id", registration.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    redirect(result("error", "This workshop certificate application has already been approved."));
  }

  const payload = {
    user_id: user.id,
    workshop_registration_id: registration.id,
    workshop_id: registration.workshop_id,
    preferred_name: preferredName,
    participant_note: participantNote,
    status: "pending",
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };

  const operation = existing
    ? admin.from("certificate_applications").update(payload).eq("id", existing.id)
    : admin.from("certificate_applications").insert(payload);
  const { error } = await operation;
  if (error) redirect(result("error", error.message));

  await admin.from("profiles").update({
    preferred_certificate_name: preferredName,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/dashboard/documents");
  revalidatePath("/admin/documents");
  redirect(result("message", "Certificate application submitted for admin review."));
}
