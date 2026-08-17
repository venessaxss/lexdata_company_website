"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { cleanPreferredName } from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(key: "message" | "error", value: string) {
  return `/admin/documents/certificates?${key}=${encodeURIComponent(value)}`;
}

export async function updateRevokedCertificateInfoAction(formData: FormData) {
  const auth = await requireAdmin("/admin/documents/certificates");

  const id = field(formData, "id");
  const recipientName = cleanPreferredName(field(formData, "recipient_name"));
  const title = field(formData, "title");
  const correctionNote = field(formData, "correction_note");

  if (!id || recipientName.length < 2 || title.length < 2 || correctionNote.length < 5) {
    redirect(
      back(
        "error",
        "Printed name, certificate title, and a clear correction note are required."
      )
    );
  }

  const { data: document } = await auth.admin
    .from("official_documents")
    .select("id,user_id,document_type,status,recipient_name,title,metadata")
    .eq("id", id)
    .maybeSingle();

  if (!document || document.document_type !== "certificate" || document.status !== "revoked") {
    redirect(
      back(
        "error",
        "Certificate information can be edited only while the certificate is revoked."
      )
    );
  }

  const metadata =
    document.metadata && typeof document.metadata === "object"
      ? document.metadata
      : {};

  const history = Array.isArray(metadata.certificate_info_revision_history)
    ? metadata.certificate_info_revision_history
    : [];

  const now = new Date().toISOString();

  const nextMetadata = {
    ...metadata,
    certificate_info_revision_history: [
      ...history,
      {
        revised_at: now,
        revised_by: auth.user.id,
        correction_note: correctionNote,
        old_recipient_name: document.recipient_name,
        new_recipient_name: recipientName,
        old_title: document.title,
        new_title: title,
      },
    ],
  };

  const { error } = await auth.admin
    .from("official_documents")
    .update({
      recipient_name: recipientName,
      title,
      metadata: nextMetadata,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "revoked");

  if (error) redirect(back("error", error.message));

  const applicationId = String(metadata.application_id || "");

  if (applicationId) {
    await auth.admin
      .from("certificate_applications")
      .update({
        preferred_name: recipientName,
        admin_note: correctionNote,
        updated_at: now,
      })
      .eq("id", applicationId);
  }

  await auth.admin.from("official_document_audit_log").insert({
    document_id: document.id,
    actor_id: auth.user.id,
    action: "certificate_information_corrected_while_revoked",
    from_status: "revoked",
    to_status: "revoked",
    details: {
      correction_note: correctionNote,
      old_recipient_name: document.recipient_name,
      new_recipient_name: recipientName,
      old_title: document.title,
      new_title: title,
    },
  });

  revalidatePath("/admin/documents/certificates");
  revalidatePath(`/documents/${id}`);
  revalidatePath("/dashboard/certificates");

  redirect(
    back(
      "message",
      "Certificate information corrected. Preview it and reissue when ready."
    )
  );
}