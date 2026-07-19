"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enrollCourseAction(formData: FormData) {
  const courseId = String(formData.get("course_id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!courseId || !slug) {
    redirect("/courses?message=Missing course information.");
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=Please login before enrolling in this course.`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    profile?.name ||
    user.email?.split("@")[0] ||
    "LexData Member";

  const email = user.email || "";

  const { data: existing } = await admin
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/courses/${slug}?message=You have already enrolled in this course.`);
  }

  const { error } = await admin.from("course_enrollments").insert({
    course_id: courseId,
    user_id: user.id,
    full_name: fullName,
    email,
    enrollment_status: "pending",
    payment_status: "pending",
  });

  if (error) {
    redirect(`/courses/${slug}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/courses/${slug}`);
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/manager/course-enrollments");
  revalidatePath("/admin/course-enrollments");

  redirect(
    `/courses/${slug}?message=Enrollment received. The LexData team will review your course access.`
  );
}

export async function updateCourseEnrollmentAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const enrollment_status = String(
    formData.get("enrollment_status") || "pending"
  ).trim();
  const payment_status = String(
    formData.get("payment_status") || "pending"
  ).trim();
  const note = String(formData.get("note") || "").trim();

  if (!id) return;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { error } = await admin
    .from("course_enrollments")
    .update({
      enrollment_status,
      payment_status,
      note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/manager/course-enrollments?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/manager/course-enrollments");
  revalidatePath("/admin/course-enrollments");
  revalidatePath("/dashboard/my-learning");

  redirect("/manager/course-enrollments?message=Course enrollment updated.");
}