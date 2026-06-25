"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function enrollCourse(courseId: string, slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect(`/login?message=${encodeURIComponent("Please login first")}`);

  const { error } = await supabase.from("enrollments").upsert({
    user_id: data.user.id,
    course_id: courseId,
    status: "active"
  });

  if (error) redirect(`/courses/${slug}?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
