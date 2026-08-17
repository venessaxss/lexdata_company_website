"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeJurisdiction } from "@/lib/official-documents";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function back(
  key: "message" | "error",
  value: string
) {
  return `/admin/documents/receipts?${key}=${encodeURIComponent(value)}`;
}

function formatSnapshot(format: any) {
  if (!format) return null;

  return {
    document_type:
      format.document_type,
    jurisdiction:
      format.jurisdiction,
    format_name:
      format.format_name,
    heading:
      format.heading,
    subheading:
      format.subheading,
    primary_color:
      format.primary_color,
    accent_color:
      format.accent_color,
    font_family:
      format.font_family,
    layout_style:
      format.layout_style,
    footer_text:
      format.footer_text,
    show_issuer_address:
      format.show_issuer_address,
    show_tax_id:
      format.show_tax_id,
  };
}

export async function reissueReceiptWithCurrentFormatAction(
  formData: FormData
) {
  const auth = await requireAdmin(
    "/admin/documents/receipts"
  );

  const id = field(formData, "id");
  const correctionReason = field(
    formData,
    "correction_reason"
  );

  if (!id) {
    redirect(
      back(
        "error",
        "Missing receipt ID."
      )
    );
  }

  if (correctionReason.length < 5) {
    redirect(
      back(
        "error",
        "Enter a clear correction reason before reissuing the receipt."
      )
    );
  }

  const { data: document, error: documentError } =
    await auth.admin
      .from("official_documents")
      .select("*")
      .eq("id", id)
      .eq("document_type", "receipt")
      .maybeSingle();

  if (documentError || !document) {
    redirect(
      back(
        "error",
        documentError?.message ||
          "Receipt not found."
      )
    );
  }

  if (document.status !== "void") {
    redirect(
      back(
        "error",
        "Only a revoked/void receipt can be reissued."
      )
    );
  }

  if (
    /refund|refunded|cancelled|canceled/i.test(
      String(
        document.revocation_reason || ""
      )
    )
  ) {
    redirect(
      back(
        "error",
        "A receipt voided because of a refund or cancellation cannot be reissued."
      )
    );
  }

  const jurisdiction =
    normalizeJurisdiction(
      document.jurisdiction
    );

  const [
    formatResult,
    issuerResult,
  ] = await Promise.all([
    auth.admin
      .from(
        "document_format_profiles"
      )
      .select("*")
      .eq(
        "document_type",
        "receipt"
      )
      .eq(
        "jurisdiction",
        jurisdiction
      )
      .maybeSingle(),

    auth.admin
      .from(
        "document_issuer_profiles"
      )
      .select("*")
      .eq(
        "jurisdiction",
        jurisdiction
      )
      .maybeSingle(),
  ]);

  const currentFormat =
    formatResult.data;

  const currentIssuer =
    issuerResult.data;

  if (
    formatResult.error ||
    !currentFormat
  ) {
    redirect(
      back(
        "error",
        formatResult.error?.message ||
          `No current ${jurisdiction} receipt format is configured.`
      )
    );
  }

  if (
    issuerResult.error ||
    !currentIssuer
  ) {
    redirect(
      back(
        "error",
        issuerResult.error?.message ||
          `No current ${jurisdiction} issuer profile is configured.`
      )
    );
  }

  const now =
    new Date().toISOString();

  const previousMetadata =
    document.metadata &&
    typeof document.metadata === "object"
      ? document.metadata
      : {};

  const previousHistory =
    Array.isArray(
      previousMetadata.reissue_history
    )
      ? previousMetadata.reissue_history
      : [];

  const previousFormat =
    previousMetadata.receipt_format ||
    null;

  const nextFormat =
    formatSnapshot(
      currentFormat
    );

  const nextMetadata = {
    ...previousMetadata,

    receipt_format:
      nextFormat,

    reissue_revision:
      Number(
        previousMetadata.reissue_revision ||
          0
      ) + 1,

    reissued_with_current_format:
      true,

    reissue_history: [
      ...previousHistory,
      {
        reissued_at:
          now,
        reissued_by:
          auth.user.id,
        correction_reason:
          correctionReason,
        prior_status:
          document.status,
        prior_revocation_reason:
          document.revocation_reason ||
          null,
        prior_receipt_format:
          previousFormat,
        new_receipt_format:
          nextFormat,
        issuer_jurisdiction:
          jurisdiction,
        issuer_stamp_url:
          currentIssuer.receipt_stamp_enabled
            ? currentIssuer.receipt_stamp_url ||
              null
            : null,
      },
    ],
  };

  const {
    error: updateError,
  } = await auth.admin
    .from("official_documents")
    .update({
      status:
        "issued",
      issued_at:
        now,
      issued_by:
        auth.user.id,
      revocation_reason:
        null,
      issuer_snapshot:
        currentIssuer,
      metadata:
        nextMetadata,
      updated_at:
        now,
    })
    .eq("id", document.id)
    .eq("status", "void");

  if (updateError) {
    redirect(
      back(
        "error",
        updateError.message
      )
    );
  }

  revalidatePath(
    "/admin/documents/receipts"
  );

  revalidatePath(
    `/documents/${document.id}`
  );

  revalidatePath(
    "/dashboard/receipts"
  );

  revalidatePath(
    "/dashboard/documents"
  );

  redirect(
    back(
      "message",
      `Receipt ${document.document_number} was reissued using the current ${jurisdiction} format and issuer snapshot.`
    )
  );
}