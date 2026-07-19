"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function updateMemberProfileAction(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard%2Fprofile%2Factions.ts");
  }

  const fullName = field(formData, "full_name");
  const institution = field(formData, "institution");
  const affiliation = field(formData, "affiliation");
  const affiliationStatus = field(formData, "affiliation_status");
  const professionStatus = field(formData, "profession_status");
  const professionTitle = field(formData, "profession_title");
  const department = field(formData, "department");
  const degree = field(formData, "degree");
  const country = field(formData, "country");
  const city = field(formData, "city");
  const phone = field(formData, "phone");
  const researchInterest = field(formData, "research_interest");
  const bio = field(formData, "bio");

  const profileCompleted = Boolean(
    fullName &&
      institution &&
      professionStatus &&
      country
  );

  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    email: user.email || null,
    full_name: fullName || user.user_metadata?.full_name || user.email,
    institution: institution || null,
    affiliation: affiliation || null,
    affiliation_status: affiliationStatus || null,
    profession_status: professionStatus || null,
    profession_title: professionTitle || null,
    department: department || null,
    degree: degree || null,
    country: country || null,
    city: city || null,
    phone: phone || null,
    research_interest: researchInterest || null,
    bio: bio || null,
    profile_completed: profileCompleted,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/dashboard/profile?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/manager/member-profiles");
  revalidatePath("/admin/member-profiles");
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");

  redirect("/dashboard/profile?message=Profile information saved.");
}