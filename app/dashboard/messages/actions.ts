"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard/messages";
  }

  return value;
}

function withNotice(returnTo: string, message: string) {
  const url = new URL(returnTo, "http://local");
  url.searchParams.set("message", message);
  return `${url.pathname}${url.search}`;
}

function selectedMessageIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("message_ids")
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0 && value.length <= 128)
    )
  );
}

export async function setMessageReadStateAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const id = readText(formData, "id");
  const returnTo = safeReturnTo(
    readText(formData, "return_to") || "/dashboard/messages"
  );
  const isRead = readText(formData, "is_read") === "true";

  if (!id) {
    redirect(withNotice(returnTo, "Message ID is missing."));
  }

  const { error } = await auth.admin
    .from("user_messages")
    .update({ is_read: isRead })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    redirect(withNotice(returnTo, error.message));
  }

  revalidatePath("/dashboard/messages");
  redirect(
    withNotice(
      returnTo,
      isRead ? "Message marked as read." : "Message marked as unread."
    )
  );
}

export async function markMessageReadAction(formData: FormData) {
  formData.set("is_read", "true");
  return setMessageReadStateAction(formData);
}

export async function deleteMessageAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const id = readText(formData, "id");
  const returnTo = safeReturnTo(
    readText(formData, "return_to") || "/dashboard/messages"
  );

  if (!id) {
    redirect(withNotice(returnTo, "Message ID is missing."));
  }

  const { error } = await auth.admin
    .from("user_messages")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    redirect(withNotice(returnTo, error.message));
  }

  revalidatePath("/dashboard/messages");
  redirect(withNotice(returnTo, "Message deleted."));
}

export async function bulkMessageAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const action = readText(formData, "bulk_action");
  const ids = selectedMessageIds(formData);
  const returnTo = safeReturnTo(
    readText(formData, "return_to") || "/dashboard/messages"
  );

  if (ids.length === 0) {
    redirect(withNotice(returnTo, "Select at least one message."));
  }

  if (
    action !== "read" &&
    action !== "unread" &&
    action !== "delete"
  ) {
    redirect(withNotice(returnTo, "Invalid bulk message action."));
  }

  let error: { message: string } | null = null;

  if (action === "delete") {
    const result = await auth.admin
      .from("user_messages")
      .delete()
      .eq("user_id", auth.user.id)
      .in("id", ids);

    error = result.error;
  } else {
    const result = await auth.admin
      .from("user_messages")
      .update({ is_read: action === "read" })
      .eq("user_id", auth.user.id)
      .in("id", ids);

    error = result.error;
  }

  if (error) {
    redirect(withNotice(returnTo, error.message));
  }

  revalidatePath("/dashboard/messages");

  const actionLabel =
    action === "delete"
      ? "deleted"
      : action === "read"
        ? "marked as read"
        : "marked as unread";

  redirect(
    withNotice(
      returnTo,
      `${ids.length} message${ids.length === 1 ? "" : "s"} ${actionLabel}.`
    )
  );
}

export async function replyToMessageAction(formData: FormData) {
  const auth = await requireProfile("/dashboard/messages");
  const messageId = readText(formData, "message_id");
  const body = readText(formData, "body");
  const returnTo = safeReturnTo(
    readText(formData, "return_to") || "/dashboard/messages"
  );

  if (!messageId || !body) {
    redirect(withNotice(returnTo, "Reply text is required."));
  }

  const { data: original, error } = await auth.admin
    .from("user_messages")
    .select("id, user_id, sender_id, sender_role, title, message_type")
    .eq("id", messageId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error || !original) {
    redirect(withNotice(returnTo, "Original message was not found."));
  }

  const recipientId = original.sender_id;

  if (!recipientId) {
    redirect(withNotice(returnTo, "This message has no reply recipient."));
  }

  const title = `Re: ${original.title || "LexData message"}`;

  const { error: insertError } = await auth.admin
    .from("user_messages")
    .insert({
      user_id: recipientId,
      sender_id: auth.user.id,
      sender_role: auth.role,
      target_role: original.sender_role || "direct",
      message_type: "reply",
      title,
      body,
      link_url: "/dashboard/messages",
      is_read: false,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    redirect(withNotice(returnTo, insertError.message));
  }

  await auth.admin
    .from("user_messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("user_id", auth.user.id);

  revalidatePath("/dashboard/messages");
  redirect(withNotice(returnTo, "Reply sent."));
}
