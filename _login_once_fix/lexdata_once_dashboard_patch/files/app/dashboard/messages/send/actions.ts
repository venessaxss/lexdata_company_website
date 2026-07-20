"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { syncMessageToParticipantEmails } from "@/lib/message-email-sync";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

export async function sendRoleMessage(formData: FormData) {
  const sender = await requireRole(["admin", "manager", "speaker"], "/dashboard/messages/send");

  const targetRole = field(formData, "target_role") || "all";
  const title = field(formData, "title");
  const body = field(formData, "body");
  const linkUrl = nullableField(formData, "link_url");

  if (!title || !body) {
    redirect("/dashboard/messages/send?message=Title and message are required");
  }

  let query = sender.admin.from("profiles").select("id, role");

  if (targetRole !== "all") {
    query = query.eq("role", targetRole);
  }

  const { data: recipients, error: recipientError } = await query;

  if (recipientError) {
    redirect(`/dashboard/messages/send?message=${encodeURIComponent(recipientError.message)}`);
  }

  const rows =
    recipients?.map((recipient: any) => ({
      user_id: recipient.id,
      sender_id: sender.user.id,
      sender_role: sender.role,
      target_role: targetRole,
      message_type: "role_broadcast",
      title,
      body,
      link_url: linkUrl,
      is_read: false,
      created_at: new Date().toISOString(),
    })) ?? [];

  if (rows.length === 0) {
    redirect("/dashboard/messages/send?message=No recipients found");
  }

  const { error } = await sender.admin.from("user_messages").insert(rows);

  if (error) {
    redirect(`/dashboard/messages/send?message=${encodeURIComponent(error.message)}`);
  }

  const sendEmailToo = String(formData.get("send_email") || "") === "on";

  if (sendEmailToo) {
    await syncMessageToParticipantEmails({
      recipientUserIds: rows.map((row: any) => row.user_id).filter(Boolean),
      subject: title,
      body,
      sourceType: "user_message",
      sourceId: null,
      workshopId: null,
    });
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/messages/send");

  redirect(`/dashboard/messages/send?message=${encodeURIComponent(`Message sent to ${rows.length} user(s)`)}`);
}

export async function sendDirectMessage(formData: FormData) {
  const sender = await requireRole(["admin", "manager", "speaker"], "/dashboard/messages/send");
  const userId = field(formData, "user_id");
  const title = field(formData, "title");
  const body = field(formData, "body");
  const linkUrl = nullableField(formData, "link_url");

  if (!userId || !title || !body) {
    redirect("/dashboard/messages/send?message=Recipient, title and message are required");
  }

  const { error } = await sender.admin.from("user_messages").insert({
    user_id: userId,
    sender_id: sender.user.id,
    sender_role: sender.role,
    target_role: "direct",
    message_type: "direct",
    title,
    body,
    link_url: linkUrl,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/dashboard/messages/send?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/messages");
  redirect("/dashboard/messages/send?message=Direct message sent");
}
