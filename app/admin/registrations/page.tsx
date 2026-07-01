import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshopRegistration } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registration = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_note?: string | null;
  payment_link?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
  payment_confirmed_at?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
  workshops?: {
    title?: string | null;
    slug?: string | null;
    price?: number | null;
    currency?: string | null;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatWorkshopPrice(registration: Registration) {
  const price = registration.workshops?.price ?? 0;
  const currency = registration.workshops?.currency || "USD";

  if (!price) return "Not set / free";

  return `${currency} ${price}`;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops:workshop_id (
        title,
        slug,
        price,
        currency
      )
    `
    )
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as Registration[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/admin"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to admin dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Workshop Registrations & Manual Payments
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Manage workshop registrations and manually update payment status,
          payment method, transfer reference, payment notes, and learning access.
          This page is not connected to Stripe.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {registrations.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            No registrations yet
          </h2>
          <p className="mt-2 text-slate-600">
            Workshop registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map((registration) => (
            <article
              key={registration.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Registration
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {registration.workshops?.title || "Workshop"}
                  </h2>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        Name:
                      </span>{" "}
                      {registration.full_name || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Email:
                      </span>{" "}
                      {registration.email || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Registration status:
                      </span>{" "}
                      {registration.status || "pending"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Payment status:
                      </span>{" "}
                      {registration.payment_status || "pending"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Workshop price:
                      </span>{" "}
                      {formatWorkshopPrice(registration)}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Received:
                      </span>{" "}
                      {registration.payment_currency || "USD"}{" "}
                      {registration.amount_received ?? 0}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Method:
                      </span>{" "}
                      {registration.payment_method || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Reference:
                      </span>{" "}
                      {registration.payment_reference || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Submitted:
                      </span>{" "}
                      {formatDate(registration.created_at)}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Confirmed:
                      </span>{" "}
                      {formatDate(registration.payment_confirmed_at)}
                    </p>
                  </div>

                  {registration.payment_note ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <p className="font-bold text-slate-800">Payment note</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {registration.payment_note}
                      </p>
                    </div>
                  ) : null}

                  {registration.admin_note ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <p className="font-bold text-slate-800">Internal note</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {registration.admin_note}
                      </p>
                    </div>
                  ) : null}

                  {registration.workshops?.slug ? (
                    <Link
                      href={`/workshops/${registration.workshops.slug}`}
                      className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open workshop page
                    </Link>
                  ) : null}
                </div>

                <form
                  action={updateWorkshopRegistration}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <input type="hidden" name="id" value={registration.id} />
                  <input type="hidden" name="back_to" value="/admin/registrations" />

                  <h3 className="text-lg font-black text-slate-950">
                    Manual Payment Update
                  </h3>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Registration status
                      </label>
                      <select
                        name="status"
                        defaultValue={registration.status || "pending"}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payment status
                      </label>
                      <select
                        name="payment_status"
                        defaultValue={registration.payment_status || "pending"}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="not_required">Not required</option>
                        <option value="pending">Pending</option>
                        <option value="instructions_sent">
                          Instructions sent
                        </option>
                        <option value="under_review">Under review</option>
                        <option value="confirmed">Confirmed / paid</option>
                        <option value="waived">Waived / sponsored</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payment method
                      </label>
                      <select
                        name="payment_method"
                        defaultValue={registration.payment_method || ""}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="">Choose method</option>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="cash">Cash</option>
                        <option value="wechat">WeChat</option>
                        <option value="alipay">Alipay</option>
                        <option value="invoice">Invoice</option>
                        <option value="sponsored">Sponsored / waived</option>
                        <option value="manual">Other manual method</option>
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Amount received
                        </label>
                        <input
                          name="amount_received"
                          type="number"
                          step="0.01"
                          defaultValue={registration.amount_received ?? 0}
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Currency
                        </label>
                        <input
                          name="payment_currency"
                          defaultValue={registration.payment_currency || "USD"}
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Transaction/reference number
                      </label>
                      <input
                        name="payment_reference"
                        defaultValue={registration.payment_reference || ""}
                        placeholder="Bank transfer number, receipt number, invoice number"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payment instruction/link
                      </label>
                      <input
                        name="payment_link"
                        defaultValue={registration.payment_link || ""}
                        placeholder="Bank instruction page, invoice link, or payment instruction link"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payment note visible to user
                      </label>
                      <textarea
                        name="payment_note"
                        rows={3}
                        defaultValue={registration.payment_note || ""}
                        placeholder="Example: Please transfer to the company bank account and send your receipt."
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Internal admin note
                      </label>
                      <textarea
                        name="admin_note"
                        rows={3}
                        defaultValue={registration.admin_note || ""}
                        placeholder="Internal note for admin/manager only"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      Save payment update
                    </button>
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}