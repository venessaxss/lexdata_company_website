import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ManagerMonitorPage() {
  const admin = createAdminClient();

  const { data: confirmed } = await admin
    .from("workshop_registrations")
    .select(`
      workshop_id,
      amount_received,
      payment_currency,
      workshops (
        title
      )
    `)
    .eq("registration_status", "confirmed")
    .eq("payment_status", "confirmed");

  const stats = new Map();

  for (const r of confirmed ?? []) {
    const id = r.workshop_id;

    if (!stats.has(id)) {
      stats.set(id, {
        title: r.workshops?.[0]?.title || "Untitled",
        count: 0,
        revenue: 0,
        currency: "USD",
      });
    }

    const item = stats.get(id);

    item.count += 1;
    item.revenue += Number(r.amount_received || 0);
  }

  const list = Array.from(stats.values());

  const totalRevenue = list.reduce((a, b) => a + b.revenue, 0);

  return (
    <main className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-black">Revenue Dashboard</h1>

        <p className="mt-2 text-slate-500">
          Confirmed payments only
        </p>

        <div className="mt-4 text-2xl font-black">
          USD {totalRevenue.toFixed(2)}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-black mb-4">Workshop Breakdown</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Workshop</th>
              <th>Users</th>
              <th>Revenue</th>
            </tr>
          </thead>

          <tbody>
            {list.map((w, i) => (
              <tr key={i} className="border-b">
                <td className="py-2 font-bold">{w.title}</td>
                <td>{w.count}</td>
                <td>USD {w.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}