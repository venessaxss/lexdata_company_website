"use client";

import { useState } from "react";
import { uploadReceiptAction } from "@/app/workshops/[slug]/receipt-actions";

type PaymentReceiptUploadFormProps = {
  slug: string;
  workshopId: string;
  registrationId: string;
  receiptUrl?: string | null;
};

export default function PaymentReceiptUploadForm({
  slug,
  workshopId,
  registrationId,
  receiptUrl,
}: PaymentReceiptUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("registrationId", registrationId);
      formData.append("slug", slug);

      await uploadReceiptAction(formData);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-black">Upload Payment Receipt</h2>

      {receiptUrl ? (
        <p className="mt-2 text-sm text-green-600">
          Receipt already uploaded
        </p>
      ) : null}

      <input
        type="file"
        className="mt-4 block w-full text-sm"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
      >
        {loading ? "Uploading..." : "Upload Receipt"}
      </button>
    </div>
  );
}