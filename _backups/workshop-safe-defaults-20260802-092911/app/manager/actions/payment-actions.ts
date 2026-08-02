"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/manager/registrations";
  }
  return value;
}

function withMessage(path: string, key: "message" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

async function notifyUser(input: {
  admin: any;
  userId?: string | null;
  email?: string | null;
  title: string;
  body: string;
  sourceType: string;
  sourceId: string;
}) {
  const { error } = await input.admin.from("internal_messages").insert({
    user_id: input.userId || null,
    recipient_email: input.email || null,
    title: input.title,
    body: input.body,
    source_type: input.sourceType,
    source_id: input.sourceId,
  });

  if (error) {
    console.error("Internal notification failed:", error.message);
  }

  if (!input.email || !process.env.RESEND_API_KEY) return;

  try {
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
  } catch (error) {
    console.error("Email notification failed:", error);
  }
}

async function revalidateRegistrationPages(
  admin: any,
  workshopId?: string | null
) {
  if (workshopId) {
    const { data: workshop } = await admin
      .from("workshops")
      .select("slug")
      .eq("id", workshopId)
      .maybeSingle();

    if (workshop?.slug) {
      revalidatePath(`/workshops/${workshop.slug}`);
    }
  }

  revalidatePath("/manager");
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/my/workshops");
}

export async function handleRegistrationManagementAction(formData: FormData) {
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/registrations"
  );

  const actor = await requireManagerOrAdmin("/manager/registrations");
  const admin = actor.admin;

  const intent = text(formData, "intent");
  const registrationId = text(formData, "registration_id");

  if (!registrationId) {
    redirect(withMessage(returnTo, "error", "Missing registration ID."));
  }

  const { data: registration, error: loadError } = await admin
    .from("workshop_registrations")
    .select(
      "id, user_id, email, full_name, workshop_id, registration_status, payment_status"
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (loadError || !registration) {
    redirect(
      withMessage(
        returnTo,
        "error",
        loadError?.message || "Registration not found."
      )
    );
  }

  const registrationStatus =
    text(formData, "registration_status") ||
    registration.registration_status ||
    "pending";

  const paymentStatus =
    text(formData, "payment_status") ||
    registration.payment_status ||
    "pending";

  const paymentLink = text(formData, "payment_link");
  const paymentNote = text(formData, "payment_note");
  const paymentCurrency = text(formData, "payment_currency") || "USD";
  const parsedAmount = Number(text(formData, "amount_received") || 0);
  const amountReceived = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  let updatePayload: Record<string, unknown>;
  let successMessage = "Registration updated.";
  let notification:
    | {
        title: string;
        body: string;
        sourceType: string;
      }
    | undefined;

  switch (intent) {
    case "grant_access":
      updatePayload = {
        access_status: "granted",
      };
      successMessage = "Workshop access granted.";
      notification = {
        title: "Workshop access granted",
        body: "Your workshop access has been granted by the LexData team.",
        sourceType: "access_granted",
      };
      break;

    case "revoke_access":
      updatePayload = {
        access_status: "revoked",
      };
      successMessage = "Workshop access revoked.";
      notification = {
        title: "Workshop access revoked",
        body: "Your workshop access has been revoked. Please contact the LexData team if you believe this is a mistake.",
        sourceType: "access_revoked",
      };
      break;

    case "save_statuses":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: paymentStatus,
      };
      successMessage = "Registration and payment statuses saved.";
      break;

    case "send_payment_message":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: "instructions_sent",
        payment_link: paymentLink || null,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment instructions saved and sent.";
      notification = {
        title: "Payment instructions sent",
        body:
          paymentNote ||
          (paymentLink
            ? `Payment instructions have been sent. Please complete payment using this link: ${paymentLink}`
            : "Payment instructions have been sent. Please complete payment and upload your receipt."),
        sourceType: "payment_instructions",
      };
      break;

    case "record_payment_received":
      updatePayload = {
        registration_status: registrationStatus,
        payment_status: "under_review",
        amount_received: amountReceived,
        payment_currency: paymentCurrency,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment information recorded.";
      notification = {
        title: "Payment information received",
        body: "Your payment information has been recorded and is now under review.",
        sourceType: "payment_received",
      };
      break;

    case "confirm_payment":
      updatePayload = {
        registration_status: "confirmed",
        payment_status: "confirmed",
        access_status: "granted",
        amount_received: amountReceived,
        payment_currency: paymentCurrency,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment confirmed and workshop access unlocked.";
      notification = {
        title: "Payment confirmed",
        body: "Your payment has been confirmed. Your workshop access is now unlocked.",
        sourceType: "payment_confirmed",
      };
      break;

    case "waive_payment":
      updatePayload = {
        registration_status: "confirmed",
        payment_status: "waived",
        access_status: "granted",
        amount_received: 0,
        payment_note: paymentNote || null,
      };
      successMessage = "Payment waived and workshop access unlocked.";
      notification = {
        title: "Workshop access unlocked",
        body: "Your payment has been waived. Your workshop access is now unlocked.",
        sourceType: "payment_waived",
      };
      break;

    default:
      redirect(withMessage(returnTo, "error", "Unknown registration action."));
  }

  const { error: updateError } = await admin
    .from("workshop_registrations")
    .update(updatePayload)
    .eq("id", registrationId);

  if (updateError) {
    redirect(withMessage(returnTo, "error", updateError.message));
  }

  if (notification) {
    await notifyUser({
      admin,
      userId: registration.user_id,
      email: registration.email,
      title: notification.title,
      body: notification.body,
      sourceType: notification.sourceType,
      sourceId: registrationId,
    });
  }

  await revalidateRegistrationPages(admin, registration.workshop_id);

  redirect(withMessage(returnTo, "message", successMessage));
}

export const sendPaymentInstructionsAction =
  handleRegistrationManagementAction;
export const updateWorkshopRegistrationPaymentAction =
  handleRegistrationManagementAction;
export const updatePaymentAction = handleRegistrationManagementAction;
export const updateWorkshopRegistration =
  handleRegistrationManagementAction;