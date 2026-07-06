import { createAdminClient } from "@/lib/supabase/admin";

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
      amount_received,
      payment_currency,
      receipt_url,
      payment_method,
      transaction_reference,
      payment_note,
      created_at,
      confirmed_at,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  const list = registrations ?? [];

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading registrations
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">
          Registrations & Manual Payments
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          Review registrations, send payment instructions, record receipts,
          confirm access, and view synced payment history.
        </p>
      </div>

      {/* SUCCESS BANNER */}
      <div className="bg-blue-50 p-3 rounded border text-sm">
        Registration payment information saved and synced
      </div>

      {/* CARDS */}
      <div className="space-y-6">

        {list.map((r: any) => (
          <div
            key={r.id}
            className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >

            {/* ================= LEFT: REGISTRATION ================= */}
            <div>

              <p className="text-xs text-gray-400 uppercase">
                Registration
              </p>

              <h2 className="text-xl font-bold mt-1">
                {r.workshops?.[0]?.title ?? r.workshops?.title ?? "Workshop"}
              </h2>

              <div className="mt-4 space-y-2 text-sm">

                <p><b>Name:</b> {r.full_name}</p>
                <p><b>Email:</b> {r.email}</p>

                <p>
                  <b>Registration status:</b>{" "}
                  {r.registration_status}
                </p>

                <p>
                  <b>Payment status:</b>{" "}
                  {r.payment_status}
                </p>

                <p>
                  <b>Workshop price:</b>{" "}
                  {r.amount_received || "Not set / free"}
                </p>

                <p>
                  <b>Method:</b> {r.payment_method || "-"}
                </p>

                <p>
                  <b>Reference:</b> {r.transaction_reference || "-"}
                </p>

                <p>
                  <b>Submitted:</b>{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>

                <p>
                  <b>Confirmed:</b>{" "}
                  {r.confirmed_at
                    ? new Date(r.confirmed_at).toLocaleString()
                    : "-"}
                </p>

              </div>

              <a
                href={`/workshops/${r.workshops?.slug}`}
                className="inline-block mt-4 text-sm text-blue-600 underline"
              >
                Open workshop page
              </a>

            </div>

            {/* ================= RIGHT: PAYMENT PANEL ================= */}
            <div className="bg-gray-50 rounded-xl p-4">

              <p className="text-xs uppercase text-gray-500 mb-3">
                Manual Payment Update
              </p>

              <div className="space-y-3">

                <select className="w-full p-2 border rounded">
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>

                <select className="w-full p-2 border rounded">
                  <option>Payment pending</option>
                  <option>Paid</option>
                  <option>Waived</option>
                </select>

                <select className="w-full p-2 border rounded">
                  <option>Choose method</option>
                  <option>Bank transfer</option>
                  <option>Cash</option>
                  <option>Online</option>
                </select>

                <div className="flex gap-2">
                  <input
                    placeholder="0"
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    placeholder="USD"
                    className="w-1/2 p-2 border rounded"
                  />
                </div>

                <input
                  placeholder="Transaction/reference number"
                  className="w-full p-2 border rounded"
                />

                <input
                  placeholder="Receipt URL / proof of payment link"
                  className="w-full p-2 border rounded"
                />

                <input
                  placeholder="Payment instruction/link"
                  className="w-full p-2 border rounded"
                />

                <textarea
                  placeholder="Payment note visible to member"
                  className="w-full p-2 border rounded"
                  rows={3}
                />

                <button className="w-full bg-black text-white py-2 rounded">
                  Save Payment Update
                </button>

              </div>
            </div>

          </div>
        ))}

      </div>
    </main>
  );
}