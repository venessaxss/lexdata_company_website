import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="card p-8">
        <p className="badge">Checkout cancelled</p>
        <h1 className="mt-4 text-3xl font-bold">No payment was completed.</h1>
        <p className="mt-3 text-slate-600">You can return to the catalog and try again whenever you are ready.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/courses" className="btn-primary">Browse courses</Link>
          <Link href="/workshops" className="btn-light">Browse workshops</Link>
        </div>
      </div>
    </section>
  );
}
