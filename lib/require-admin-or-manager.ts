import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?message=Please login first");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/unauthorized");
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    redirect("/unauthorized");
  }

  return {
    user,
    profile,
    role: profile.role,
  };
}
