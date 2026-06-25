"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createCourse(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const category_id = String(formData.get("category_id") || "") || null;
  const short_description = String(formData.get("short_description") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const level = String(formData.get("level") ?? "Beginner");
  const language = String(formData.get("language") ?? "English");
  const cover_url = String(formData.get("cover_url") ?? "").trim() || null;
  const is_published = formData.get("is_published") === "on";

  if (!title || !slug) redirect("/admin/courses/new?message=Title and slug are required");

  const { error } = await supabase.from("courses").insert({
    title,
    slug,
    category_id,
    short_description,
    intro,
    level,
    language,
    cover_url,
    is_published,
    instructor_id: user.id
  });

  if (error) redirect(`/admin/courses/new?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/courses");
  redirect("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const category_id = String(formData.get("category_id") || "") || null;
  const short_description = String(formData.get("short_description") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const level = String(formData.get("level") ?? "Beginner");
  const language = String(formData.get("language") ?? "English");
  const cover_url = String(formData.get("cover_url") ?? "").trim() || null;
  const is_published = formData.get("is_published") === "on";

  const { error } = await supabase
    .from("courses")
    .update({
      title,
      slug,
      category_id,
      short_description,
      intro,
      level,
      language,
      cover_url,
      is_published,
      updated_at: new Date().toISOString()
    })
    .eq("id", courseId);

  if (error) redirect(`/admin/courses/${courseId}/edit?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/courses");
  redirect("/admin/courses");
}

export async function createLesson(courseId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim() || null;
  const position = Number(formData.get("position") ?? 1);
  const is_published = formData.get("is_published") === "on";

  if (!title) redirect(`/admin/courses/${courseId}/lessons?message=Lesson title is required`);

  const { error } = await supabase.from("lessons").insert({
    course_id: courseId,
    title,
    content,
    video_url,
    position,
    is_published
  });

  if (error) redirect(`/admin/courses/${courseId}/lessons?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${courseId}/lessons`);
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", courseId);
  revalidatePath("/courses");
  redirect("/admin/courses");
}
