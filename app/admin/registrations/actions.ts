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

  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");
  revalidatePath("/manager/monitor");
}