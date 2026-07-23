"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getRegistration(auth: any, id: string) {
  const { data, error } = await auth.admin
    .from("workshop_registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirect(`/manager/registrations?message=${encodeURIComponent(error?.message || "Registration not found")}`);
  }

  return data;
}

export async function confirmRegistrationAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");
  const note = readText(formData, "manager_note");

  if (!id) redirect("/manager/registrations?message=Missing registration id");

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      registration_status: "confirmed",
      payment_status: "confirmed",
      access_status: "granted",
      manager_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/manager/registrations?message=${encodeURIComponent(error.message)}`);
  }

  const registration = await getRegistration(auth, id);

  if (registration.user_id) {
    await auth.admin.from("user_messages").insert({
      user_id: registration.user_id,
      sender_id: auth.user.id,
      sender_role: auth.role,
      target_role: "member",
      message_type: "registration_confirmed",
      title: "Workshop registration confirmed",
      body: note || "Your LexData workshop registration has been confirmed. Please check the workshop page for next steps.",
      link_url: "/my/workshops",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/monitor");
  redirect("/manager/registrations?message=Registration confirmed");
}

export async function rejectRegistrationAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");
  const note = readText(formData, "manager_note");

  if (!id) redirect("/manager/registrations?message=Missing registration id");

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      registration_status: "rejected",
      payment_status: "rejected",
      access_status: "revoked",
      manager_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/manager/registrations?message=${encodeURIComponent(error.message)}`);
  }

  const registration = await getRegistration(auth, id);

  if (registration.user_id) {
    await auth.admin.from("user_messages").insert({
      user_id: registration.user_id,
      sender_id: auth.user.id,
      sender_role: auth.role,
      target_role: "member",
      message_type: "registration_rejected",
      title: "Workshop registration update",
      body: note || "Your workshop registration could not be confirmed yet. Please contact LexData for more details.",
      link_url: "/dashboard/messages",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/manager/registrations");
  redirect("/manager/registrations?message=Registration rejected");
}

export async function reviewRegistrationAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");
  const note = readText(formData, "manager_note");

  if (!id) redirect("/manager/registrations?message=Missing registration id");

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      registration_status: "reviewing",
      manager_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/manager/registrations?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/manager/registrations");
  redirect("/manager/registrations?message=Review note saved");
}

export async function sendRegistrationMessageAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");
  const title = readText(formData, "title") || "LexData registration message";
  const body = readText(formData, "body");

  if (!id || !body) {
    redirect("/manager/registrations?message=Message text is required");
  }

  const registration = await getRegistration(auth, id);

  if (!registration.user_id) {
    redirect("/manager/registrations?message=This registration is not linked to a user account, so an inbox message cannot be sent");
  }

  const { error } = await auth.admin.from("user_messages").insert({
    user_id: registration.user_id,
    sender_id: auth.user.id,
    sender_role: auth.role,
    target_role: "member",
    message_type: "registration_message",
    title,
    body,
    link_url: "/dashboard/messages",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/manager/registrations?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/messages");
  revalidatePath("/manager/registrations");
  redirect("/manager/registrations?message=Message sent to registrant");
}

export const confirmRegistration = async (id: string) => {
  const formData = new FormData();
  formData.set("id", id);
  return confirmRegistrationAction(formData);
};

export const rejectRegistration = async (id: string) => {
  const formData = new FormData();
  formData.set("id", id);
  return rejectRegistrationAction(formData);
};


export async function grantWorkshopAccessAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");

  if (!id) {
    redirect("/manager/registrations?message=Missing registration id");
  }

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      access_status: "granted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/manager/registrations?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/my/workshops");

  redirect(
    "/manager/registrations?message=Workshop access granted"
  );
}


export async function revokeWorkshopAccessAction(formData: FormData) {
  const auth = await requireManagerOrAdmin("/manager/registrations");
  const id = readText(formData, "id");

  if (!id) {
    redirect("/manager/registrations?message=Missing registration id");
  }

  const { error } = await auth.admin
    .from("workshop_registrations")
    .update({
      access_status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/manager/registrations?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/my/workshops");

  redirect(
    "/manager/registrations?message=Workshop access revoked"
  );
}