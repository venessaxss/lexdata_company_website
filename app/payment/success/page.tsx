import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="card p-8">
        <p className="badge">Payment complete</p>
        <h1 className="mt-4 text-3xl font-bold">Thank you. Your access is being activated.</h1>
        <p className="mt-3 text-slate-600">
          Stripe has confirmed the checkout. The webhook will mark the payment as paid and add the course/workshop to your account.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/my/courses" className="btn-primary">My courses</Link>
          <Link href="/my/workshops" className="btn-light">My workshops</Link>
        </div>
      </div>
    </section>
  );
}
