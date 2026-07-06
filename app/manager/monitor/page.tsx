import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ManagerMonitorPage() {
  const admin = createAdminClient();

  const { data } = await admin
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

  for (const r of data ?? []) {
    const id = r.workshop_id;

    if (!stats.has(id)) {
      stats.set(id, {
        title: r.workshops?.[0]?.title || "Untitled",
        count: 0,
        revenue: 0,
      });
    }

    const item = stats.get(id);

    item.count += 1;
    item.revenue += Number(r.amount_received || 0);
  }

  const list = Array.from(stats.values());

  const totalRevenue = list.reduce((a, b) => a + b.revenue, 0);

  return (
    <main className="p-6">
      <h1>Revenue</h1>

      <p>Total: USD {totalRevenue.toFixed(2)}</p>

      {list.map((w, i) => (
        <div key={i}>
          <p>{w.title}</p>
          <p>{w.count}</p>
          <p>{w.revenue}</p>
        </div>
      ))}
    </main>
  );
}