import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

type EmailSyncInput = {
  recipientUserIds: string[];
  subject: string;
  body: string;
  sourceType?: string;
  sourceId?: string | null;
  workshopId?: string | null;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function messageToHtml(subject: string, body: string) {
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 16px; font-size: 22px;">${safeSubject}</h2>

      <div style="font-size: 15px;">
        ${safeBody}
      </div>

      <p style="margin-top: 28px; font-size: 13px; color: #64748b;">
        This message was sent from LexData. Please log in to your LexData account to view full details.
      </p>
    </div>
  `;
}

export async function syncMessageToParticipantEmails({
  recipientUserIds,
  subject,
  body,
  sourceType = "user_message",
  sourceId = null,
  workshopId = null,
}: EmailSyncInput) {
  const admin = createAdminClient();

  const uniqueUserIds = Array.from(new Set(recipientUserIds.filter(Boolean)));

  if (uniqueUserIds.length === 0) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
    };
  }

  const { data: profilesData, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", uniqueUserIds);

  if (profilesError) {
    throw new Error(`Could not load recipient emails: ${profilesError.message}`);
  }

  const profiles = (profilesData ?? []) as ProfileRow[];

  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    let recipientEmail = profile.email;

    if (!recipientEmail) {
      const { data: authUserData } = await admin.auth.admin.getUserById(
        profile.id
      );

      recipientEmail = authUserData?.user?.email || null;
    }

    if (!recipientEmail) {
      failed += 1;

      await admin.from("email_delivery_logs").insert({
        recipient_email: "missing-email",
        recipient_user_id: profile.id,
        subject,
        source_type: sourceType,
        source_id: sourceId,
        workshop_id: workshopId,
        status: "failed",
        provider: "resend",
        error_message:
          "Recipient profile has no email and Auth user email was not found",
      });

      continue;
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: messageToHtml(subject, body),
      text: `${subject}\n\n${body}`,
    });

    await admin.from("email_delivery_logs").insert({
      recipient_email: recipientEmail,
      recipient_user_id: profile.id,
      subject,
      source_type: sourceType,
      source_id: sourceId,
      workshop_id: workshopId,
      status: result.ok ? "sent" : "failed",
      provider: "resend",
      provider_message_id: result.messageId,
      error_message: result.error,
    });

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    total: profiles.length,
    sent,
    failed,
  };
}