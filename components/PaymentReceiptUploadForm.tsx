"use client";

import { useState } from "react";
import { uploadReceiptAction } from "@/app/workshops/[slug]/receipt-actions";

type Props = {
  slug: string;
  workshopId: string;
  registrationId: string;
  receiptUrl?: string | null;
};

export default function PaymentReceiptUploadForm({
  slug,
  registrationId,
  receiptUrl,
}: Props) {
  const [fileName, setFileName] = useState("");

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-black text-slate-950">
        Upload payment receipt
      </h2>

      <form action={uploadReceiptAction} className="mt-5 space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="registrationId" value={registrationId} />

        <input
          type="file"
          name="receipt"
          accept="image/*,.pdf"
          required
          onChange={(event) =>
            setFileName(event.target.files?.[0]?.name || "")
          }
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
        />

        {fileName ? (
          <p className="text-sm font-bold text-slate-500">{fileName}</p>
        ) : null}

        <button
          type="submit"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
        >
          Upload receipt
        </button>
      </form>

      {receiptUrl ? (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
        >
          View current receipt
        </a>
      ) : null}
    </section>
  );
}