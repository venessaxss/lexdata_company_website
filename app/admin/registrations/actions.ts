"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionUserProfile = {
  id: string;
  role?: string | null;
};

async function requirePaymentManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile as ActionUserProfile;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function updateWorkshopRegistration(formData: FormData) {
  const actor = await requirePaymentManager();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/registrations?message=Missing registration ID");
  }

  const status = field(formData, "status") || "pending";

  const paymentStatus = field(formData, "payment_status") || "pending";

  const paymentMethod = nullableField(formData, "payment_method");

  const paymentReference = nullableField(formData, "payment_reference");

  const paymentNote = nullableField(formData, "payment_note");

  const paymentLink = nullableField(formData, "payment_link");

  const adminNote = nullableField(formData, "admin_note");

  const amountReceived = numberField(formData, "amount_received", 0);

  const paymentCurrency = field(formData, "payment_currency") || "USD";

  const shouldConfirmPayment =
    paymentStatus === "confirmed" || paymentStatus === "paid";

  const updatePayload: Record<string, unknown> = {
    status,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    payment_note: paymentNote,
    payment_link: paymentLink,
    admin_note: adminNote,
    amount_received: amountReceived,
    payment_currency: paymentCurrency,
    updated_at: new Date().toISOString(),
  };

  if (shouldConfirmPayment) {
    updatePayload.payment_confirmed_at = new Date().toISOString();
    updatePayload.payment_confirmed_by = actor.id;
  }

  const { data: registration, error } = await supabase
    .from("workshop_registrations")
    .update(updatePayload)
    .eq("id", id)
    .select(
      `
      *,
      workshops:workshop_id (
        title,
        slug
      )
    `
    )
    .single();

  if (error) {
    redirect(`/admin/registrations?message=${encodeURIComponent(error.message)}`);
  }

  const userId = registration?.user_id as string | null | undefined;
  const workshopTitle =
    registration?.workshops?.title || registration?.workshop_title || "Workshop";
  const workshopSlug =
    registration?.workshops?.slug || registration?.workshop_slug || "";

  if (userId) {
    if (
      paymentStatus === "instructions_sent" ||
      paymentStatus === "pending" ||
      paymentStatus === "under_review"
    ) {
      const bodyParts = [
        `Your registration for ${workshopTitle} has been updated.`,
        paymentMethod ? `Payment method: ${paymentMethod}` : null,
        paymentLink ? `Payment instruction/link: ${paymentLink}` : null,
        paymentNote ? `Payment note: ${paymentNote}` : null,
      ].filter(Boolean);

      await supabase.from("user_messages").insert({
        user_id: userId,
        sender_id: actor.id,
        sender_role: actor.role,
        target_role: "member",
        message_type: "payment_update",
        title: "Workshop payment instructions",
        body: bodyParts.join("\n"),
        link_url: paymentLink || (workshopSlug ? `/workshops/${workshopSlug}` : null),
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (shouldConfirmPayment) {
      await supabase.from("user_messages").insert({
        user_id: userId,
        sender_id: actor.id,
        sender_role: actor.role,
        target_role: "student",
        message_type: "payment_confirmed",
        title: "Workshop access confirmed",
        body: `Your registration for ${workshopTitle} has been confirmed. You can now access the available workshop sessions and materials from your dashboard.`,
        link_url: workshopSlug ? `/workshops/${workshopSlug}` : "/dashboard/my-learning",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (paymentStatus === "waived") {
      await supabase.from("user_messages").insert({
        user_id: userId,
        sender_id: actor.id,
        sender_role: actor.role,
        target_role: "member",
        message_type: "access_confirmed",
        title: "Workshop access confirmed",
        body: `Your access for ${workshopTitle} has been approved by the LexData team.`,
        link_url: workshopSlug ? `/workshops/${workshopSlug}` : "/dashboard/my-learning",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/my-learning");
  revalidatePath("/workshops");

  if (workshopSlug) {
    revalidatePath(`/workshops/${workshopSlug}`);
  }

  const backTo = field(formData, "back_to") || "/admin/registrations";

  redirect(`${backTo}?message=Registration payment updated`);
}