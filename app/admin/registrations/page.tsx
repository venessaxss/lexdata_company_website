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
  receipt_url?: string | null;
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

type PaymentRecord = {
  id: string;
  registration_id?: string | null;
  action_type?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_note?: string | null;
  admin_note?: string | null;
  receipt_url?: string | null;
  payment_link?: string | null;
  amount?: number | null;
  currency?: string | null;
  recorded_role?: string | null;
  created_at?: string | null;
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

function formatStatus(value?: string | null) {
  if (!value) return "-";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

  const registrationIds = registrations.map((registration) => registration.id);

  let paymentRecords: PaymentRecord[] = [];

  if (registrationIds.length > 0) {
    const { data: paymentRecordData } = await supabase
      .from("workshop_payment_records")
      .select("*")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false });

    paymentRecords = (paymentRecordData ?? []) as PaymentRecord[];
  }

  const paymentRecordsByRegistrationId = new Map<string, PaymentRecord[]>();

  for (const record of paymentRecords) {
    if (!record.registration_id) continue;

    const existing =
      paymentRecordsByRegistrationId.get(record.registration_id) ?? [];

    existing.push(record);
    paymentRecordsByRegistrationId.set(record.registration_id, existing);
  }

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
          Manage workshop registrations, send payment instructions, record
          received payment information, confirm access, and view the synced
          payment history.
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
          {registrations.map((registration) => {
            const records =
              paymentRecordsByRegistrationId.get(registration.id) ?? [];

            return (
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
                        {formatStatus(registration.status || "pending")}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-800">
                          Payment status:
                        </span>{" "}
                        {formatStatus(registration.payment_status || "pending")}
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
                        <p className="font-bold text-slate-800">
                          Payment note visible to member
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {registration.payment_note}
                        </p>
                      </div>
                    ) : null}

                    {registration.admin_note ? (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                        <p className="font-bold">Internal note</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {registration.admin_note}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {registration.workshops?.slug ? (
                        <Link
                          href={`/workshops/${registration.workshops.slug}`}
                          className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Open workshop page
                        </Link>
                      ) : null}

                      {registration.receipt_url ? (
                        <a
                          href={registration.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Open receipt
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={updateWorkshopRegistration}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <input type="hidden" name="id" value={registration.id} />
                    <input
                      type="hidden"
                      name="back_to"
                      value="/admin/registrations"
                    />

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
                          defaultValue={
                            registration.payment_status || "pending"
                          }
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
                            Amount
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
                            defaultValue={
                              registration.payment_currency || "USD"
                            }
                            className="w-full rounded-xl border bg-white px-4 py-3"
                          />
                        </div>
                      </div>

                      <input
                        name="payment_reference"
                        defaultValue={registration.payment_reference || ""}
                        placeholder="Transaction/reference number"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <input
                        name="receipt_url"
                        defaultValue={registration.receipt_url || ""}
                        placeholder="Receipt URL / proof of payment link"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <input
                        name="payment_link"
                        defaultValue={registration.payment_link || ""}
                        placeholder="Payment instruction/link"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <textarea
                        name="payment_note"
                        rows={3}
                        defaultValue={registration.payment_note || ""}
                        placeholder="Payment note visible to member"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <textarea
                        name="admin_note"
                        rows={3}
                        defaultValue={registration.admin_note || ""}
                        placeholder="Internal note"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <div className="grid gap-3">
                        <button
                          type="submit"
                          name="action_type"
                          value="send_payment_info"
                          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600"
                        >
                          Send payment instructions
                        </button>

                        <button
                          type="submit"
                          name="action_type"
                          value="record_payment_received"
                          className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-500"
                        >
                          Record payment info received
                        </button>

                        <button
                          type="submit"
                          name="action_type"
                          value="confirm_payment"
                          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600"
                        >
                          Confirm payment and unlock access
                        </button>

                        <button
                          type="submit"
                          name="action_type"
                          value="waive_payment"
                          className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-bold text-white hover:bg-purple-600"
                        >
                          Waive payment and unlock access
                        </button>

                        <button
                          type="submit"
                          name="action_type"
                          value="save"
                          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Save without sending message
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {records.length > 0 ? (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Payment history
                    </h3>

                    <div className="mt-4 space-y-3">
                      {records.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
                        >
                          <div className="flex flex-wrap justify-between gap-3">
                            <p className="font-bold text-slate-950">
                              {formatStatus(
                                record.action_type || "payment_record"
                              )}{" "}
                              / {formatStatus(record.payment_status || "pending")}
                            </p>

                            <p className="text-xs font-semibold text-slate-400">
                              {formatDate(record.created_at)}
                            </p>
                          </div>

                          <div className="mt-2 grid gap-1 md:grid-cols-2">
                            <p>
                              Amount: {record.currency || "USD"}{" "}
                              {record.amount ?? 0}
                            </p>
                            <p>Method: {record.payment_method || "-"}</p>
                            <p>Reference: {record.payment_reference || "-"}</p>
                            <p>Recorded by: {record.recorded_role || "-"}</p>
                          </div>

                          {record.payment_note ? (
                            <p className="mt-2 whitespace-pre-wrap">
                              Member note: {record.payment_note}
                            </p>
                          ) : null}

                          {record.admin_note ? (
                            <p className="mt-2 whitespace-pre-wrap text-amber-700">
                              Internal note: {record.admin_note}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {record.receipt_url ? (
                              <a
                                href={record.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Open receipt
                              </a>
                            ) : null}

                            {record.payment_link ? (
                              <a
                                href={record.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              >
                                Open payment link
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}