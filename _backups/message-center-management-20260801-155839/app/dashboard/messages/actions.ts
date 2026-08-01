"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function markMessageReadAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const id = readText(formData, "id");

  if (!id) return;

  await auth.admin
    .from("user_messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  revalidatePath("/dashboard/messages");
}

export async function replyToMessageAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const messageId = readText(formData, "message_id");
  const body = readText(formData, "body");

  if (!messageId || !body) {
    redirect("/dashboard/messages?message=Reply text is required");
  }

  const { data: original, error } = await auth.admin
    .from("user_messages")
    .select("id, user_id, sender_id, sender_role, title, message_type")
    .eq("id", messageId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error || !original) {
    redirect("/dashboard/messages?message=Original message was not found");
  }

  const recipientId = original.sender_id;

  if (!recipientId) {
    redirect("/dashboard/messages?message=This message has no reply recipient");
  }

  const title = `Re: ${original.title || "LexData message"}`;

  const { error: insertError } = await auth.admin.from("user_messages").insert({
    user_id: recipientId,
    sender_id: auth.user.id,
    sender_role: auth.role,
    target_role: original.sender_role || "direct",
    message_type: "reply",
    title,
    body,
    link_url: "/dashboard/messages",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    redirect(`/dashboard/messages?message=${encodeURIComponent(insertError.message)}`);
  }

  await auth.admin
    .from("user_messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("user_id", auth.user.id);

  revalidatePath("/dashboard/messages");
  redirect("/dashboard/messages?message=Reply sent");
}
