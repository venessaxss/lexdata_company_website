import { requireManagerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format((cents ?? 0) / 100);
}

export default async function ManagerPaymentsPage() {
  await requireManagerOrAdmin();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id,product_type,product_id,amount_cents,currency,status,created_at,stripe_checkout_session_id,profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const paidTotal = (payments ?? [])
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + (p.amount_cents ?? 0), 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Payment management</h1>
      <p className="mt-2 text-slate-600">Manager view for course and workshop payments.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Paid revenue</p><p className="mt-2 text-2xl font-bold">{money(paidTotal, "usd")}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Payment records</p><p className="mt-2 text-2xl font-bold">{payments?.length ?? 0}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Pending</p><p className="mt-2 text-2xl font-bold">{(payments ?? []).filter((p: any) => p.status === "pending").length}</p></div>
      </div>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-4">Date</th><th>User</th><th>Product</th><th>Amount</th><th>Status</th><th>Stripe session</th></tr>
          </thead>
          <tbody>
            {(payments ?? []).map((payment: any) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="p-4">{new Date(payment.created_at).toLocaleString()}</td>
                <td>{payment.profiles?.full_name ?? "User"}</td>
                <td>{payment.product_type}</td>
                <td>{money(payment.amount_cents, payment.currency)}</td>
                <td><span className="badge">{payment.status}</span></td>
                <td className="max-w-xs truncate text-slate-500">{payment.stripe_checkout_session_id ?? "-"}</td>
              </tr>
            ))}
            {(!payments || payments.length === 0) ? <tr><td className="p-4 text-slate-600" colSpan={6}>No payment records yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
