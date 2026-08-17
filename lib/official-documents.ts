export type DocumentJurisdiction = "PK" | "SA" | "CN";

export const jurisdictionNames: Record<DocumentJurisdiction, string> = {
  PK: "Pakistan",
  SA: "Saudi Arabia",
  CN: "China",
};

export function normalizeJurisdiction(value: unknown): DocumentJurisdiction {
  return value === "SA" || value === "CN" ? value : "PK";
}

export function receiptHeading(jurisdiction: DocumentJurisdiction) {
  if (jurisdiction === "SA") return "إيصال دفع · Payment Receipt";
  if (jurisdiction === "CN") return "付款收据 · Payment Receipt";
  return "Official Payment Receipt";
}

export function taxDocumentNotice(
  jurisdiction: DocumentJurisdiction,
  isTaxDocument: boolean
) {
  if (isTaxDocument) {
    return "This document carries an external tax-authority reference. Verify that reference through the applicable authority service.";
  }
  if (jurisdiction === "SA") {
    return "Proof of payment only. This is not a ZATCA FATOORAH Tax Invoice or Simplified Tax Invoice.";
  }
  if (jurisdiction === "CN") {
    return "Proof of payment only. This is not an official Chinese fapiao (发票); request fapiao through the authorized tax-invoice channel.";
  }
  return "Proof of payment only. This is not an FBR fiscal/sales-tax invoice and no sales tax is represented unless a valid STRN and authority reference are shown.";
}

export function formatDocumentMoney(amount: unknown, currency: unknown) {
  const value = Number(amount || 0);
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export function cleanPreferredName(value: unknown) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
