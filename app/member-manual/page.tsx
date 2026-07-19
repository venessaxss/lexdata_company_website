import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const manualUrl = "/manuals/LexData_General_Member_User_Manual.pdf";

export default function MemberManualPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to homepage
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          LexData User Guide
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
          General Member User Manual
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          This guide explains how new members can create an account, login,
          use the dashboard, view messages, register for workshops, and manage
          their account.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Open PDF
          </a>

          <a
            href={manualUrl}
            download
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Download PDF
          </a>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <iframe
          src={manualUrl}
          title="LexData General Member User Manual"
          className="h-[80vh] w-full"
        />
      </section>
    </main>
  );
}