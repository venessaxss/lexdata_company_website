import { uploadPaymentReceiptAction } from "@/app/workshops/[slug]/receipt-actions";

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
  return (
    <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Upload payment receipt
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            New registrations may already be closed, but you can still upload
            your payment receipt for your existing registration.
          </p>
        </div>

        {receiptUrl ? (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            View uploaded receipt
          </a>
        ) : null}
      </div>

      <form action={uploadPaymentReceiptAction} className="mt-5 space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="workshop_id" value={workshopId} />
        <input type="hidden" name="registration_id" value={registrationId} />

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Receipt file
          </label>

          <input
            type="file"
            name="receipt"
            accept="image/*,.pdf"
            required
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-slate-700"
          />

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Accepted formats: PDF, JPG, PNG, WEBP. Maximum size: 10MB.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
        >
          Send receipt
        </button>
      </form>
    </section>
  );
}