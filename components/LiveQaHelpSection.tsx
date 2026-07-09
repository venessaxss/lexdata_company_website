"use client";

import { usePathname } from "next/navigation";
import { submitLiveQaRequestAction } from "@/app/live-qa/actions";

export default function LiveQaHelpSection() {
  const pathname = usePathname();

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-700">
              Live Q&A Help Desk
            </p>

            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Need help? Ask LexData directly.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Participants can submit questions about registration, payment,
              workshop access, certificates, course materials, or technical
              problems. Our team will review and reply from the manager/admin
              dashboard.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Registration help",
                "Payment support",
                "Workshop access",
                "Certificate questions",
                "Technical issue",
                "General inquiry",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form
            action={submitLiveQaRequestAction}
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm"
          >
            <input type="hidden" name="page_path" value={pathname} />

            <h3 className="text-2xl font-black text-slate-950">
              Submit your question
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Leave your contact information so the team can follow up.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-black text-slate-600">
                  Name
                </label>
                <input
                  name="name"
                  placeholder="Your name"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
                />
              </div>
            </div>

            <label className="mt-4 block text-sm font-black text-slate-600">
              Category
            </label>
            <select
              name="category"
              defaultValue="General Help"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="Registration">Registration</option>
              <option value="Payment">Payment</option>
              <option value="Workshop Access">Workshop Access</option>
              <option value="Certificate">Certificate</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="General Help">General Help</option>
            </select>

            <label className="mt-4 block text-sm font-black text-slate-600">
              Question
            </label>
            <textarea
              name="question"
              required
              rows={6}
              placeholder="Tell us what you need help with..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
            />

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-800"
            >
              Submit Q&A Request
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}