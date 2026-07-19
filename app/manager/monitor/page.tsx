import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default async function ManagerMonitorPage() {
  noStore();

  const admin = createAdminClient();

  const [
    workshopsResult,
    registrationsResult,
    usersResult,
    messagesResult,
    visitsResult,
  ] = await Promise.all([
    admin.from("workshops").select("id, title, currency"),
    admin.from("workshop_registrations").select("id, workshop_id, registration_status, payment_status, amount_received, payment_currency, receipt_url"),
    admin.from("profiles").select("id, role, created_at"),
    admin.from("internal_messages").select("id"),
    admin.from("website_visits").select("id, path, created_at"),
  ]);

  const workshops = workshopsResult.data ?? [];
  const registrations = registrationsResult.data ?? [];
  const users = usersResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const visits = visitsResult.data ?? [];

  const confirmedPaid = registrations.filter(
    (r: any) => r.registration_status === "confirmed" && r.payment_status === "confirmed"
  );
  const pending = registrations.filter((r: any) => !r.payment_status || r.payment_status === "pending");
  const instructions = registrations.filter((r: any) => r.payment_status === "instructions_sent");
  const review = registrations.filter((r: any) => r.payment_status === "under_review");
  const waived = registrations.filter((r: any) => r.payment_status === "waived");

  const paidAmount = confirmedPaid.reduce(
    (sum: number, r: any) => sum + Number(r.amount_received || 0),
    0
  );

  const total = registrations.length;

  const bars = [
    { label: "Unpaid / Pending", value: pending.length, color: "bg-amber-500" },
    { label: "Instructions Sent", value: instructions.length, color: "bg-blue-600" },
    { label: "Under Review", value: review.length, color: "bg-orange-500" },
    { label: "Confirmed Paid", value: confirmedPaid.length, color: "bg-emerald-600" },
    { label: "Waived", value: waived.length, color: "bg-slate-600" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Overall Monitoring Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Paid money is calculated only from manually confirmed registration payments.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["Confirmed Paid Amount", `USD ${paidAmount.toFixed(2)}`],
            ["Total Registrations", total],
            ["Confirmed Paid", confirmedPaid.length],
            ["Pending / Unpaid", pending.length],
            ["Receipts Under Review", review.length],
            ["Instructions Sent", instructions.length],
            ["Users", users.length],
            ["Website Visits", visits.length],
            ["Workshops", workshops.length],
            ["Internal Messages", messages.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {label}
              </p>
              <p className="mt-4 text-3xl font-black text-slate-950">
                {value}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-950">
            Payment Status Graphic
          </h2>

          <div className="mt-6 space-y-5">
            {bars.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-sm font-black text-slate-700">
                  <span>{bar.label}</span>
                  <span>{bar.value} records</span>
                </div>
                <div className="mt-2 h-5 rounded-full bg-slate-100">
                  <div
                    className={`h-5 rounded-full ${bar.color}`}
                    style={{ width: `${pct(bar.value, total)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-950">
            Registration Funnel
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {bars.map((bar) => (
              <div key={bar.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className={`mx-auto h-20 w-20 rounded-full ${bar.color} flex items-center justify-center text-xl font-black text-white`}>
                  {pct(bar.value, total)}%
                </div>
                <p className="mt-3 text-sm font-black text-slate-900">
                  {bar.label}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {bar.value} / {total}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}