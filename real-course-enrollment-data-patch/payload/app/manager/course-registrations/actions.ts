"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function target(courseId: string, key: "message" | "error", message: string) {
  const params = new URLSearchParams({ [key]: message });
  return `/manager/course-registrations/${encodeURIComponent(courseId)}?${params}`;
}

const enrollmentStatuses = new Set([
  "pending", "approved", "confirmed", "rejected", "cancelled",
]);

const paymentStatuses = new Set([
  "pending", "paid", "waived", "failed", "refunded",
]);

export async function updateCourseEnrollmentAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/course-registrations");
  const id = value(formData, "enrollment_id");
  const courseId = value(formData, "course_id");
  const enrollmentStatus = value(formData, "enrollment_status");
  const paymentStatus = value(formData, "payment_status");
  const note = value(formData, "note") || null;

  if (!id || !courseId) {
    redirect("/manager/course-registrations?error=Missing course enrollment.");
  }

  if (!enrollmentStatuses.has(enrollmentStatus)) {
    redirect(target(courseId, "error", "Invalid enrollment status."));
  }

  if (!paymentStatuses.has(paymentStatus)) {
    redirect(target(courseId, "error", "Invalid payment status."));
  }

  const { error } = await auth.admin
    .from("course_enrollments")
    .update({
      enrollment_status: enrollmentStatus,
      payment_status: paymentStatus,
      note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("course_id", courseId);

  if (error) redirect(target(courseId, "error", error.message));

  revalidatePath("/manager/course-registrations");
  revalidatePath(`/manager/course-registrations/${courseId}`);
  revalidatePath("/manager/course-enrollments");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/courses");

  redirect(target(courseId, "message", "Course enrollment updated."));
}
