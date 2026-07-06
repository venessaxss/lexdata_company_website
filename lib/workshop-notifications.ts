import { createAdminClient } from "@/lib/supabase/admin";

type NotifyInput = {
  userId?: string | null;
  email?: string | null;
  title: string;
  body: string;
  sourceType?: string;
  sourceId?: string;
};

export async function sendWorkshopNotification(input: NotifyInput) {
  const admin = createAdminClient();

  await admin.from("internal_messages").insert({
    user_id: input.userId || null,
    recipient_email: input.email || null,
    title: input.title,
    body: input.body,
    source_type: input.sourceType || "workshop_registration",
    source_id: input.sourceId || null,
  });

  if (!input.email || !process.env.RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "LexData <noreply@lexdataai.com>",
      to: input.email,
      subject: input.title,
      text: input.body,
    }),
  });
}