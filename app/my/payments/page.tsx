import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format((cents ?? 0) / 100);
}

export default async function MyPaymentsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/unauthorized");

  const { data: payments } = await supabase
    .from("payments")
    .select("id,product_type,product_id,amount_cents,currency,status,created_at,stripe_checkout_session_id")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Invoices & payments</h1>
      <p className="mt-2 text-slate-600">Your checkout attempts and completed purchases.</p>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-4">Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Stripe session</th></tr>
          </thead>
          <tbody>
            {(payments ?? []).map((payment: any) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="p-4">{new Date(payment.created_at).toLocaleString()}</td>
                <td>{payment.product_type}</td>
                <td>{money(payment.amount_cents, payment.currency)}</td>
                <td><span className="badge">{payment.status}</span></td>
                <td className="max-w-xs truncate text-slate-500">{payment.stripe_checkout_session_id ?? "-"}</td>
              </tr>
            ))}
            {(!payments || payments.length === 0) ? (
              <tr><td className="p-4 text-slate-600" colSpan={5}>No payment records yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
