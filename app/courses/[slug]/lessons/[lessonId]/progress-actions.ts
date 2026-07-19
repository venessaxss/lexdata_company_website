"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markLessonComplete(lessonId: string, slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  await supabase.from("lesson_progress").upsert({
    user_id: data.user.id,
    lesson_id: lessonId,
    completed: true,
    updated_at: new Date().toISOString()
  });

  revalidatePath("/dashboard");
  redirect(`/courses/${slug}`);
}
