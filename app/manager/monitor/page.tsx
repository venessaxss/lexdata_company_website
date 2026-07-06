import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  currency?: string | null;
};

type Registration = {
  id: string;
  workshop_id: string;
  registration_status?: string | null;
  payment_status?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
  receipt_url?: string | null;
};

export default async function ManagerMonitorPage() {
  noStore();

  const admin = createAdminClient();

  const [{ data: workshopsData }, { data: registrationsData }] =
    await Promise.all([
      admin.from("workshops").select("id, title, currency"),
      admin
        .from("workshop_registrations")
        .select(
          "id, workshop_id, registration_status, payment_status, amount_received, payment_currency, receipt_url"
        ),
    ]);

  const workshops = (workshopsData ?? []) as Workshop[];
  const registrations = (registrationsData ?? []) as Registration[];

  const workshopById = new Map<string, Workshop>();
  for (const workshop of workshops) {
    workshopById.set(workshop.id, workshop);
  }

  const confirmedPaid = registrations.filter(
    (item) =>
      item.registration_status === "confirmed" &&
      item.payment_status === "confirmed"
  );

  const underReview = registrations.filter(
    (item) => item.payment_status === "under_review"
  );

  const instructionsSent = registrations.filter(
    (item) => item.payment_status === "instructions_sent"
  );

  const totalConfirmedAmount = confirmedPaid.reduce(
    (sum, item) => sum + Number(item.amount_received || 0),
    0
  );

  const workshopStats = new Map<
    string,
    {
      title: string;
      currency: string;
      confirmedCount: number;
      confirmedAmount: number;
      totalRegistrations: number;
      receiptsUploaded: number;
    }
  >();

  for (const registration of registrations) {
    const workshop = workshopById.get(registration.workshop_id);
    const workshopId = registration.workshop_id;

    if (!workshopStats.has(workshopId)) {
      workshopStats.set(workshopId, {
        title: workshop?.title || "Unknown workshop",
        currency:
          registration.payment_currency || workshop?.currency || "USD",
        confirmedCount: 0,
        confirmedAmount: 0,
        totalRegistrations: 0,
        receiptsUploaded: 0,
      });
    }

    const item = workshopStats.get(workshopId);
    if (!item) continue;

    item.totalRegistrations += 1;

    if (registration.receipt_url) {
      item.receiptsUploaded += 1;
    }

    if (
      registration.registration_status === "confirmed" &&
      registration.payment_status === "confirmed"
    ) {
      item.confirmedCount += 1;
      item.confirmedAmount += Number(registration.amount_received || 0);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Overall Dashboard
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Payment totals are calculated only from manager/admin manually
            confirmed registration records.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Confirmed Paid Amount
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              USD {totalConfirmedAmount.toFixed(2)}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              From confirmed registrations only
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Confirmed Paid Records
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {confirmedPaid.length}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Manual confirmations
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Under Review
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {underReview.length}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Receipts waiting for review
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Instructions Sent
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {instructionsSent.length}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Waiting for user payment
            </p>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-950">
            Workshop-wise payment summary
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="py-3">Workshop</th>
                  <th className="py-3">Total Registrations</th>
                  <th className="py-3">Receipts Uploaded</th>
                  <th className="py-3">Confirmed Paid</th>
                  <th className="py-3">Confirmed Amount</th>
                </tr>
              </thead>

              <tbody>
                {Array.from(workshopStats.entries()).map(([id, item]) => (
                  <tr key={id} className="border-b border-slate-100">
                    <td className="py-4 font-bold text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-4 font-bold text-slate-700">
                      {item.totalRegistrations}
                    </td>
                    <td className="py-4 font-bold text-slate-700">
                      {item.receiptsUploaded}
                    </td>
                    <td className="py-4 font-bold text-slate-700">
                      {item.confirmedCount}
                    </td>
                    <td className="py-4 font-black text-slate-950">
                      {item.currency} {item.confirmedAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {workshopStats.size === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center font-bold text-slate-400"
                    >
                      No registration records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}