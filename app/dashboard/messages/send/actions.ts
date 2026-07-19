"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMessageToParticipantEmails } from "@/lib/message-email-sync";

type SenderProfile = {
  id: string;
  role?: string | null;
  full_name?: string | null;
};

async function requireMessageSender() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager", "speaker"].includes(profile.role)) {
    redirect("/dashboard/messages");
  }

  return profile as SenderProfile;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

export async function sendRoleMessage(formData: FormData) {
  const sender = await requireMessageSender();

  const supabase = createAdminClient();

  const targetRole = field(formData, "target_role") || "all";
  const title = field(formData, "title");
  const body = field(formData, "body");
  const linkUrl = nullableField(formData, "link_url");

  if (!title || !body) {
    redirect("/dashboard/messages/send?message=Title and message are required");
  }

  let query = supabase.from("profiles").select("id, role");

  if (targetRole !== "all") {
    query = query.eq("role", targetRole);
  }

  const { data: recipients, error: recipientError } = await query;

  if (recipientError) {
    redirect(
      `/dashboard/messages/send?message=${encodeURIComponent(
        recipientError.message
      )}`
    );
  }

  const rows =
    recipients?.map((recipient) => ({
      user_id: recipient.id,
      sender_id: sender.id,
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

  const { error } = await supabase.from("user_messages").insert(rows);
  if (error) {
  redirect(
    `/dashboard/messages/send?message=${encodeURIComponent(error.message)}`
  );
}

const sendEmailToo = String(formData.get("send_email") || "") === "on";

if (sendEmailToo) {
  const recipientUserIds = Array.from(
    new Set(
      rows
        .map((row: any) => row.recipient_id || row.user_id || row.to_user_id)
        .filter(Boolean)
    )
  );

  const emailSubject =
    String(formData.get("subject") || formData.get("title") || "").trim() ||
    "LexData message";

  const emailBody =
    String(
      formData.get("body") ||
        formData.get("message") ||
        formData.get("content") ||
        ""
    ).trim() || emailSubject;

  await syncMessageToParticipantEmails({
    recipientUserIds,
    subject: emailSubject,
    body: emailBody,
    sourceType: "user_message",
    sourceId: null,
    workshopId: null,
  });
}
  
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/messages/send");

  redirect(
    `/dashboard/messages/send?message=${encodeURIComponent(
      `Message sent to ${rows.length} user(s)`
    )}`
  );
}
