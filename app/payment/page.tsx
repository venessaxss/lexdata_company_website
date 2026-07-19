import Link from "next/link";

export default function PaymentPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <p className="badge inline-block">Payment</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight">Workshop payment information</h1>
      <p className="mt-5 leading-7 text-slate-600">
        Keep payment details here only after confirming the final bank account and registration workflow. For production, connect this page with an admin-managed payment settings table or a secure payment provider.
      </p>

      <div className="card mt-8 p-6">
        <h2 className="text-xl font-bold">Manual payment workflow</h2>
        <ol className="mt-5 space-y-3 text-sm text-slate-700">
          <li>1. Student registers for the workshop.</li>
          <li>2. Student completes bank transfer or approved payment method.</li>
          <li>3. Student sends receipt with full name and institution.</li>
          <li>4. Admin confirms enrollment and certificate eligibility.</li>
        </ol>
        <Link href="/contact" className="btn-primary mt-6 inline-block">Contact for payment confirmation</Link>
      </div>
    </section>
  );
}
