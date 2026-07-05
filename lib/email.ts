import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    return {
      ok: false,
      messageId: null,
      error: "Missing RESEND_API_KEY or EMAIL_FROM",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || undefined,
    });

    if (error) {
      return {
        ok: false,
        messageId: null,
        error: error.message || "Email provider error",
      };
    }

    return {
      ok: true,
      messageId: data?.id || null,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      messageId: null,
      error:
        error instanceof Error ? error.message : "Unknown email sending error",
    };
  }
}