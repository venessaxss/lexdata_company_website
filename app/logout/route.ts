import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clearDurableAppSession } from "@/lib/app-session";

export async function GET() {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } finally {
    await clearDurableAppSession();
  }

  redirect("/login");
}