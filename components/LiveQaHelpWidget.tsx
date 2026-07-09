"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { submitLiveQaRequestAction } from "@/app/live-qa/actions";

export default function LiveQaHelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Q&A help"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-2xl font-black text-white shadow-2xl ring-4 ring-blue-100 transition hover:scale-105 hover:bg-blue-800"
      >
        ?
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="ml-auto flex min-h-full max-w-xl items-center">
            <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                    Live Q&A Help Desk
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    Need help?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ask us about registration, payment, workshop access,
                    certificates, course materials, or technical problems.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>

              <form
                action={submitLiveQaRequestAction}
                className="mt-6 space-y-4"
              >
                <input type="hidden" name="page_path" value={pathname} />

                <div className="grid gap-4 md:grid-cols-2">
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

                <div>
                  <label className="block text-sm font-black text-slate-600">
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
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-600">
                    Question
                  </label>
                  <textarea
                    name="question"
                    required
                    rows={5}
                    placeholder="Tell us what you need help with..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
                  />
                </div>

                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-800"
                >
                  Submit Q&A Request
                </button>
              </form>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Your request will be sent to the LexData manager/admin help
                desk.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}