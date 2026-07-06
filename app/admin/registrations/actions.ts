"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function confirmRegistration(id: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: "confirmed",
      payment_status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
}

export async function rejectRegistration(id: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      registration_status: "rejected",
      payment_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/manager/registrations");
}

export async function addManagerNote(id: string, note: string) {
  const admin = createAdminClient();

  await admin
    .from("workshop_registrations")
    .update({
      manager_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/manager/registrations");
}