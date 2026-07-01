"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

export async function updateWorkshopRegistration(formData: FormData) {
  await requireAdminOrManager();

  const supabase = createAdminClient();

  const id = field(formData, "id");
  const status = field(formData, "status") || "registered";
  const paymentStatus = field(formData, "payment_status") || "pending";
  const paymentLink = nullableField(formData, "payment_link");
  const adminNote = nullableField(formData, "admin_note");
  const returnTo = field(formData, "return_to") || "/admin/registrations";

  if (!id) {
    redirect(`${returnTo}?message=Missing registration ID`);
  }

  const { data: registration } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops (
        title,
        slug
      )
    `
    )
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("workshop_registrations")
    .update({
      status,
      payment_status: paymentStatus,
      payment_link: paymentLink,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  if (registration?.user_id) {
    if (paymentLink && paymentStatus !== "confirmed") {
      await supabase.from("user_messages").insert({
        user_id: registration.user_id,
        title: "Payment link for your workshop",
        body: `Please complete the payment for ${
          registration.workshops?.title || "your workshop"
        }. After payment is confirmed, full session links will be unlocked.`,
        link_url: paymentLink,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (paymentStatus === "confirmed") {
      await supabase.from("user_messages").insert({
        user_id: registration.user_id,
        title: "Payment confirmed",
        body: `Your payment has been confirmed. You can now access the full session arrangement for ${
          registration.workshops?.title || "your workshop"
        }.`,
        link_url: registration.workshops?.slug
          ? `/workshops/${registration.workshops.slug}`
          : "/workshops",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (registration?.workshops?.slug) {
    revalidatePath(`/workshops/${registration.workshops.slug}`);
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");
  revalidatePath("/dashboard/messages");
  revalidatePath("/workshops");

  redirect(`${returnTo}?message=Registration updated`);
}