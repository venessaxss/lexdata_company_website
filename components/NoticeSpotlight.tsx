import Link from "next/link";

export default function NoticeSpotlight() {
  return (
    <section className="bg-blue-700 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-100">
                Important Notice for Registered Members
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                Please complete payment on time and upload your receipt.
              </h2>

              <p className="mt-4 max-w-4xl text-base leading-7 text-blue-50 md:text-lg">
                If you have registered for a LexData workshop, please follow the
                payment instructions sent by the manager/admin. After payment,
                upload your receipt from the registered workshop page. Your
                payment will be reviewed, and access will be unlocked after
                confirmation.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-sm font-black">1. Check your workshop</p>
                  <p className="mt-2 text-sm leading-6 text-blue-50">
                    Log in and open the workshop page you registered for.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-sm font-black">2. Upload receipt</p>
                  <p className="mt-2 text-sm leading-6 text-blue-50">
                    After payment, upload your receipt in the payment section.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-sm font-black">3. Need help?</p>
                  <p className="mt-2 text-sm leading-6 text-blue-50">
                    Use the “?” Q&A help button if you have any problem.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-64">
              <Link
                href="/workshops"
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-blue-700 hover:bg-blue-50"
              >
                Go to Workshops
              </Link>

              <Link
                href="/dashboard/messages"
                className="rounded-2xl border border-white/30 px-6 py-4 text-center text-sm font-black text-white hover:bg-white/10"
              >
                Check My Messages
              </Link>

              <Link
                href="/member-manual"
                className="rounded-2xl border border-white/30 px-6 py-4 text-center text-sm font-black text-white hover:bg-white/10"
              >
                Read User Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}