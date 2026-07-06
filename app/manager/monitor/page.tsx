import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ManagerMonitorPage() {
  const admin = createAdminClient();

  const { data: confirmedRegistrations } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      workshop_id,
      amount_received,
      payment_currency,
      registration_status,
      payment_status,
      workshops (
        id,
        title,
        slug
      )
    `)
    .eq("registration_status", "confirmed")
    .eq("payment_status", "confirmed");

  const workshopStats = new Map();

  for (const row of confirmedRegistrations ?? []) {
    const id = row.workshop_id;
    const amount = Number(row.amount_received || 0);
    const currency = row.payment_currency || "USD";

    if (!workshopStats.has(id)) {
      workshopStats.set(id, {
        workshopId: id,
        title: row.workshops?.title || "Untitled",
        currency,
        confirmedCount: 0,
        confirmedAmount: 0,
      });
    }

    const item = workshopStats.get(id);

    item.confirmedCount += 1;
    item.confirmedAmount += amount;
  }

  const workshopList = Array.from(workshopStats.values());

  const totalConfirmedAmount = workshopList.reduce(
    (sum, w) => sum + w.confirmedAmount,
    0
  );

  return (
    <main className="p-6 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-black">Manager Monitor</h1>

        <p className="text-sm text-slate-500 mt-2">
          Based on manually confirmed registration records
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">
              Confirmed Registrations
            </p>
            <p className="text-xl font-black">
              {confirmedRegistrations?.length ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">
              Confirmed Revenue
            </p>
            <p className="text-xl font-black">
              USD {totalConfirmedAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-black mb-4">
          Workshop-wise Summary
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b text-slate-500">
              <th className="py-2">Workshop</th>
              <th>Users</th>
              <th>Revenue</th>
            </tr>
          </thead>

          <tbody>
            {workshopList.map((w) => (
              <tr key={w.workshopId} className="border-b">
                <td className="py-3 font-bold">{w.title}</td>
                <td>{w.confirmedCount}</td>
                <td>
                  {w.currency} {w.confirmedAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}