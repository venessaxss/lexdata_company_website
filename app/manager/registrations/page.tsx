import { createAdminClient } from "@/lib/supabase/admin";
import { updatePaymentAction } from "@/app/manager/actions/payment-actions";

export const dynamic = "force-dynamic";

export default async function ManagerRegistrationsPage() {
  const admin = createAdminClient();

  const { data: registrations, error } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      full_name,
      email,
      registration_status,
      payment_status,
      payment_method,
      amount_received,
      payment_currency,
      transaction_reference,
      receipt_url,
      payment_note,
      created_at,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading data
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  const list = registrations ?? [];

  return (
    <main className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">
          Manager Registrations Panel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage registrations, payments, notes, and approvals
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-6">

        {list.map((r: any) => (
          <div
            key={r.id}
            className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >

            {/* ================= LEFT SIDE ================= */}
            <div>

              <h2 className="text-lg font-bold">
                {r.workshops?.[0]?.title ?? r.workshops?.title ?? "Workshop"}
              </h2>

              <div className="text-sm mt-3 space-y-1">

                <p><b>Name:</b> {r.full_name}</p>
                <p><b>Email:</b> {r.email}</p>

                <p>
                  <b>Registration:</b> {r.registration_status}
                </p>

                <p>
                  <b>Payment:</b> {r.payment_status}
                </p>

                <p>
                  <b>Amount:</b>{" "}
                  {r.payment_currency ?? "USD"}{" "}
                  {r.amount_received ?? 0}
                </p>

                <p>
                  <b>Reference:</b> {r.transaction_reference || "-"}
                </p>

                {r.receipt_url && (
                  <a
                    href={r.receipt_url}
                    target="_blank"
                    className="text-blue-600 underline text-xs"
                  >
                    View Receipt
                  </a>
                )}

                {r.payment_note && (
                  <p className="text-xs text-blue-600 mt-2">
                    Note: {r.payment_note}
                  </p>
                )}

              </div>

            </div>

            {/* ================= RIGHT SIDE (FUNCTIONAL PAYMENT FORM) ================= */}
            <form
              action={updatePaymentAction}
              className="bg-gray-50 rounded-xl p-4 space-y-3"
            >

              <input type="hidden" name="id" value={r.id} />

              <select
                name="registration_status"
                defaultValue={r.registration_status}
                className="w-full p-2 border rounded"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                name="payment_status"
                defaultValue={r.payment_status}
                className="w-full p-2 border rounded"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="waived">Waived</option>
              </select>

              <select
                name="payment_method"
                defaultValue={r.payment_method || ""}
                className="w-full p-2 border rounded"
              >
                <option value="">Method</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>

              <div className="flex gap-2">
                <input
                  name="amount_received"
                  defaultValue={r.amount_received || 0}
                  className="w-1/2 p-2 border rounded"
                  placeholder="Amount"
                  type="number"
                />

                <input
                  name="currency"
                  defaultValue={r.payment_currency || "USD"}
                  className="w-1/2 p-2 border rounded"
                />
              </div>

              <input
                name="reference"
                defaultValue={r.transaction_reference || ""}
                placeholder="Reference"
                className="w-full p-2 border rounded"
              />

              <input
                name="receipt_url"
                defaultValue={r.receipt_url || ""}
                placeholder="Receipt URL"
                className="w-full p-2 border rounded"
              />

              <textarea
                name="payment_note"
                defaultValue={r.payment_note || ""}
                placeholder="Manager note"
                className="w-full p-2 border rounded"
                rows={3}
              />

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded"
              >
                Save Payment Update
              </button>

            </form>

          </div>
        ))}

      </div>
    </main>
  );
}