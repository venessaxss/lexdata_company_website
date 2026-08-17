import Link from "next/link";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyDocumentsPage() {
  await requireProfile("/dashboard/documents");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm font-black text-blue-700"
      >
        &larr; Dashboard
      </Link>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
          Participant document center
        </p>
        <h1 className="mt-3 text-4xl font-black">
          Certificates and receipts
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Certificate applications and receipt applications now have separate workspaces.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          href="/dashboard/certificates"
          className="rounded-[2rem] border border-blue-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Certificate applications
          </p>
          <h2 className="mt-3 text-2xl font-black">Certificates</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Apply after attendance confirmation, choose your preferred printed name,
            and access issued certificates.
          </p>
          <p className="mt-6 font-black text-blue-700">
            Open certificates -&gt;
          </p>
        </Link>

        <Link
          href="/dashboard/receipts"
          className="rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Receipt applications
          </p>
          <h2 className="mt-3 text-2xl font-black">Receipts</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Request a receipt after payment confirmation, submit personal or company
            recipient details, and access issued receipts.
          </p>
          <p className="mt-6 font-black text-emerald-700">
            Open receipts -&gt;
          </p>
        </Link>
      </section>
    </main>
  );
}
