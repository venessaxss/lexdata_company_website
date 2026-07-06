"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadMaterialAction(formData: FormData) {
  const admin = createAdminClient();

  const session_id = String(formData.get("session_id"));
  const media_url = String(formData.get("media_url"));
  const media_type = String(formData.get("media_type"));

  await admin
    .from("workshop_sessions")
    .update({ media_url, media_type })
    .eq("id", session_id);
}