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
  const short_description = String(
    formData.get("short_description") ?? ""
  ).trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const level = String(formData.get("level") ?? "Beginner");
  const language = String(formData.get("language") ?? "English");
  const cover_url = String(formData.get("cover_url") ?? "").trim() || null;
  const price_cents = Number(formData.get("price_cents") || 0);
  const currency = String(formData.get("currency") || "usd").toLowerCase();
  const stripe_price_id =
    String(formData.get("stripe_price_id") || "").trim() || null;
  const is_published = formData.get("is_published") === "on";

  const is_home_highlighted =
    formData.get("is_home_highlighted") === "on";
  const home_highlight_order = Number(
    formData.get("home_highlight_order") || 0
  );
  const home_badge =
    String(formData.get("home_badge") || "").trim() || "Featured Course";
  const home_cta =
    String(formData.get("home_cta") || "").trim() || "View Course";

  if (!title || !slug) {
    redirect("/admin/courses/new?message=Title and slug are required");
  }

  const { error } = await supabase.from("courses").insert({
    title,
    slug,
    category_id,
    short_description,
    intro,
    level,
    language,
    cover_url,
    price_cents,
    currency,
    stripe_price_id,
    is_published,
    instructor_id: user.id,

    is_home_highlighted,
    home_highlight_order,
    home_badge,
    home_cta,
  });

  if (error) {
    redirect(
      `/admin/courses/new?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/admin/courses");

  redirect("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const category_id = String(formData.get("category_id") || "") || null;
  const short_description = String(
    formData.get("short_description") ?? ""
  ).trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const level = String(formData.get("level") ?? "Beginner");
  const language = String(formData.get("language") ?? "English");
  const cover_url = String(formData.get("cover_url") ?? "").trim() || null;
  const price_cents = Number(formData.get("price_cents") || 0);
  const currency = String(formData.get("currency") || "usd").toLowerCase();
  const stripe_price_id =
    String(formData.get("stripe_price_id") || "").trim() || null;
  const is_published = formData.get("is_published") === "on";

  const is_home_highlighted =
    formData.get("is_home_highlighted") === "on";
  const home_highlight_order = Number(
    formData.get("home_highlight_order") || 0
  );
  const home_badge =
    String(formData.get("home_badge") || "").trim() || "Featured Course";
  const home_cta =
    String(formData.get("home_cta") || "").trim() || "View Course";

  if (!title || !slug) {
    redirect(
      `/admin/courses/${courseId}/edit?message=Title and slug are required`
    );
  }

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
      price_cents,
      currency,
      stripe_price_id,
      is_published,

      is_home_highlighted,
      home_highlight_order,
      home_badge,
      home_cta,

      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    redirect(
      `/admin/courses/${courseId}/edit?message=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/admin/courses");

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

  if (!title) {
    redirect(
      `/admin/courses/${courseId}/lessons?message=Lesson title is required`
    );
  }

  const { error } = await supabase.from("lessons").insert({
    course_id: courseId,
    title,
    content,
    video_url,
    position,
    is_published,
  });

  if (error) {
    redirect(
      `/admin/courses/${courseId}/lessons?message=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/lessons`);

  redirect(`/admin/courses/${courseId}/lessons`);
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("courses").delete().eq("id", courseId);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/admin/courses");

  redirect("/admin/courses");
}