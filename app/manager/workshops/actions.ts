"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ManagerProfile = {
  id: string;
  role?: string | null;
};

async function requireManagerOrAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/workshops");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile as ManagerProfile;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

export async function updateWorkshopStatusByManager(formData: FormData) {
  const actor = await requireManagerOrAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/manager/workshops?message=Missing workshop ID");
  }

  const recruitmentStatus = field(formData, "recruitment_status") || "open";
  const processStatus = field(formData, "process_status") || "not_started";
  const statusNote = nullableField(formData, "status_note");
  const internalStatusNote = nullableField(formData, "internal_status_note");

  const { error } = await supabase
    .from("workshops")
    .update({
      recruitment_status: recruitmentStatus,
      process_status: processStatus,
      status_note: statusNote,
      internal_status_note: internalStatusNote,
      status_updated_at: new Date().toISOString(),
      status_updated_by: actor.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/manager/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");
  revalidatePath("/manager/workshops");

  redirect("/manager/workshops?message=Workshop status updated");
}