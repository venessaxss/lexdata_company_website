"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

export async function confirmRegistration(id: string) {
  await requireRole(["manager"], "/manager/registrations"); // managers + admins only

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
  await requireRole(["manager"], "/manager/registrations"); // managers + admins only

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
  await requireRole(["manager"], "/manager/registrations"); // managers + admins only

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