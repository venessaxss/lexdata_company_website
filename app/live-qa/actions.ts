"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function submitLiveQaRequestAction(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const category = String(formData.get("category") || "General Help").trim();
  const question = String(formData.get("question") || "").trim();
  const pagePath = String(formData.get("page_path") || "/").trim();

  if (!question) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await admin.from("live_qa_requests").insert({
    user_id: user?.id || null,
    name,
    email,
    category,
    question,
    page_path: pagePath,
    status: "open",
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath("/manager/live-help");
  revalidatePath("/admin/live-help");
}

export async function answerLiveQaRequestAction(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const id = String(formData.get("id") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  const status = String(formData.get("status") || "answered").trim();

  if (!id) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await admin
    .from("live_qa_requests")
    .update({
      answer,
      status,
      answered_by: user?.id || null,
      answered_at: answer ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/manager/live-help");
  revalidatePath("/admin/live-help");
}