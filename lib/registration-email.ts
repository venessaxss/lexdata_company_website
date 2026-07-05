import { syncMessageToParticipantEmails } from "@/lib/message-email-sync";

type RegistrationEmailInput = {
  userId: string;
  registrationId?: string | null;
  workshopId?: string | null;
  workshopTitle?: string | null;
};

type PaymentInstructionEmailInput = RegistrationEmailInput & {
  paymentMethod?: string | null;
  paymentNote?: string | null;
  paymentLink?: string | null;
  paymentCurrency?: string | null;
  amount?: number | null;
};

type PaymentReceivedEmailInput = RegistrationEmailInput & {
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentNote?: string | null;
  receiptUrl?: string | null;
  paymentCurrency?: string | null;
  amount?: number | null;
};

export async function sendRegistrationReceivedEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
}: RegistrationEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Your LexData workshop registration has been received",
    body: `
Dear participant,

Your workshop registration has been received.

Workshop: ${workshopTitle || "LexData workshop"}

The manager will review your registration and send payment instructions if payment is required.

Please log in to your LexData account to check your registration and payment status.

LexData Team
    `.trim(),
    sourceType: "registration_received",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}

export async function sendPaymentInstructionsEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
  paymentMethod,
  paymentNote,
  paymentLink,
  paymentCurrency = "USD",
  amount = 0,
}: PaymentInstructionEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Payment instructions for your LexData workshop",
    body: `
Dear participant,

Payment instructions have been sent for your workshop registration.

Workshop: ${workshopTitle || "LexData workshop"}

${paymentMethod ? `Payment method: ${paymentMethod}` : ""}
${amount && amount > 0 ? `Amount: ${paymentCurrency} ${amount}` : ""}

Payment note:
${paymentNote || "Please log in to your LexData account to view the payment details."}

Payment link:
${paymentLink || "No payment link was attached."}

After payment, please upload your payment receipt on the workshop page.

LexData Team
    `.trim(),
    sourceType: "payment_instructions",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}

export async function sendPaymentReceivedReviewEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
  paymentMethod,
  paymentReference,
  paymentNote,
  receiptUrl,
  paymentCurrency = "USD",
  amount = 0,
}: PaymentReceivedEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Your LexData payment information is under review",
    body: `
Dear participant,

Your payment information has been received and is now under review.

Workshop: ${workshopTitle || "LexData workshop"}

${paymentMethod ? `Payment method: ${paymentMethod}` : ""}
${paymentReference ? `Payment reference: ${paymentReference}` : ""}
${amount && amount > 0 ? `Amount received: ${paymentCurrency} ${amount}` : ""}
${receiptUrl ? `Receipt/link: ${receiptUrl}` : ""}

${paymentNote ? `Note: ${paymentNote}` : ""}

The LexData team will review your payment and confirm your access soon.

LexData Team
    `.trim(),
    sourceType: "payment_received_under_review",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}

export async function sendPaymentConfirmedEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
}: RegistrationEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Your LexData payment has been confirmed",
    body: `
Dear participant,

Your workshop payment has been confirmed.

Workshop: ${workshopTitle || "LexData workshop"}

Your access has now been unlocked. Please log in to your LexData account to view workshop materials, sessions, links, and learning content.

LexData Team
    `.trim(),
    sourceType: "payment_confirmed",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}

export async function sendPaymentWaivedEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
}: RegistrationEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Your LexData workshop access has been approved",
    body: `
Dear participant,

Your workshop access has been approved.

Workshop: ${workshopTitle || "LexData workshop"}

No further payment is required. Please log in to your LexData account to access the workshop content.

LexData Team
    `.trim(),
    sourceType: "payment_waived",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}

export async function sendRegistrationCancelledEmail({
  userId,
  registrationId,
  workshopId,
  workshopTitle,
}: RegistrationEmailInput) {
  return syncMessageToParticipantEmails({
    recipientUserIds: [userId],
    subject: "Your LexData workshop registration was cancelled",
    body: `
Dear participant,

Your workshop registration has been cancelled.

Workshop: ${workshopTitle || "LexData workshop"}

Please log in to your LexData account for more details.

LexData Team
    `.trim(),
    sourceType: "registration_cancelled",
    sourceId: registrationId || null,
    workshopId: workshopId || null,
  });
}