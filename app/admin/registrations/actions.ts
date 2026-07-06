"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * CONFIRM PAYMENT + ACCESS
 */
export async function confirmRegistration(id: string, note?: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: "confirmed",
      payment_status: "confirmed",
      manager_note: note || "Approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");
  revalidatePath("/manager/monitor");
}

/**
 * REJECT PAYMENT
 */
export async function rejectRegistration(id: string, note?: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: "rejected",
      payment_status: "rejected",
      manager_note: note || "Rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/registrations");
}

/**
 * ADD MANAGER NOTE
 */
export async function addManagerNote(id: string, note: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      manager_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/registrations");
}