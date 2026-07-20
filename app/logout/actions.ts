"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clearDurableAppSession } from "@/lib/app-session";

export async function logoutAction() {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } finally {
    await clearDurableAppSession();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}