"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function safeCourseId(value: string) {
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
}

function destination(
  courseId: string,
  key: "message" | "error",
  value: string
) {
  const params = new URLSearchParams();
  params.set(key, value);

  return (
    `/manager/course-registrations/${encodeURIComponent(courseId)}` +
    `?${params.toString()}`
  );
}

const registrationStatuses = new Set([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

const paymentStatuses = new Set([
  "pending",
  "confirmed",
  "paid",
  "waived",
  "refunded",
]);

const accessStatuses = new Set([
  "pending",
  "granted",
  "revoked",
  "blocked",
]);

export async function updateCourseEnrollmentAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin(
    "/manager/course-registrations"
  );

  const enrollmentId = text(formData, "enrollment_id");
  const courseId = safeCourseId(text(formData, "course_id"));

  const registrationStatus = text(
    formData,
    "registration_status"
  );

  const paymentStatus = text(
    formData,
    "payment_status"
  );

  const accessStatus = text(
    formData,
    "access_status"
  );

  const amountText = text(formData, "amount_received");
  const amount = amountText ? Number(amountText) : 0;

  const paymentCurrency =
    text(formData, "payment_currency").toUpperCase() || "USD";

  const paymentNote = text(formData, "payment_note") || null;
  const receiptUrl = text(formData, "receipt_url") || null;

  if (!courseId || !enrollmentId) {
    redirect(
      "/manager/course-registrations?error=Invalid enrollment."
    );
  }

  if (!registrationStatuses.has(registrationStatus)) {
    redirect(
      destination(
        courseId,
        "error",
        "Invalid registration status."
      )
    );
  }

  if (!paymentStatuses.has(paymentStatus)) {
    redirect(
      destination(courseId, "error", "Invalid payment status.")
    );
  }

  if (!accessStatuses.has(accessStatus)) {
    redirect(
      destination(courseId, "error", "Invalid access status.")
    );
  }

  if (!Number.isFinite(amount) || amount < 0) {
    redirect(
      destination(
        courseId,
        "error",
        "Amount received must be zero or greater."
      )
    );
  }

  const { error } = await actor.admin
    .from("enrollments")
    .update({
      registration_status: registrationStatus,
      payment_status: paymentStatus,
      access_status: accessStatus,
      amount_received: amount,
      payment_currency: paymentCurrency,
      payment_note: paymentNote,
      receipt_url: receiptUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .eq("course_id", courseId);

  if (error) {
    redirect(destination(courseId, "error", error.message));
  }

  revalidatePath("/manager/course-registrations");
  revalidatePath(
    `/manager/course-registrations/${courseId}`
  );
  revalidatePath("/my/courses");
  revalidatePath("/dashboard");

  redirect(
    destination(courseId, "message", "Enrollment updated.")
  );
}