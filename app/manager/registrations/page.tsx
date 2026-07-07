import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import * as paymentActions from "@/app/manager/actions/payment-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{ workshop?: string }> | { workshop?: string };
};

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  currency?: string | null;
};

type Registration = {
  id: string;
  workshop_id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  registration_status?: string | null;
  payment_status?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
  payment_note?: string | null;
  payment_link?: string | null;
  receipt_url?: string | null;
  created_at?: string | null;
};

function label(status?: string | null) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeClass(status?: string | null) {
  if (status === "confirmed" || status === "waived") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "instructions_sent" || status === "under_review") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (status === "rejected" || status === "cancelled") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function money(amount?: number | null, currency?: string | null) {
  return `${currency || "USD"} ${Number(amount || 0).toFixed(2)}`;
}

export default async function ManagerRegistrationsPage({
  searchParams,
}: PageProps) {
  noStore();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedWorkshopId = resolvedSearchParams.workshop || "all";

  const admin = createAdminClient();

  const { data: workshopsData, error: workshopsError } = await admin
    .from("workshops")
    .select("id, title, slug, currency")
    .order("title", { ascending: true });

  let registrationsQuery = admin
    .from("workshop_registrations")
    .select(
      `
      id,
      workshop_id,
      user_id,
      full_name,
      email,
      registration_status,
      payment_status,
      amount_received,
      payment_currency,
      payment_note,
      payment_link,
      receipt_url,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (selectedWorkshopId !== "all") {
    registrationsQuery = registrationsQuery.eq(
      "workshop_id",
      selectedWorkshopId
    );
  }

  const { data: registrationsData, error: registrationsError } =
    await registrationsQuery;

  const workshops = (workshopsData ?? []) as Workshop[];
  const registrations = (registrationsData ?? []) as Registration[];

  const workshopById = new Map<string, Workshop>();

  for (const workshop of workshops) {
    workshopById.set(workshop.id, workshop);
  }

  const confirmedPaid = registrations.filter(
    (registration) =>
      registration.registration_status === "confirmed" &&
      registration.payment_status === "confirmed"
  );

  const confirmedAmount = confirmedPaid.reduce(
    (sum, registration) => sum + Number(registration.amount_received || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Registration & Payment Management
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Send payment messages, edit statuses, check receipts, and confirm
            access.
          </p>
        </div>

        {workshopsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Failed to load workshops: {workshopsError.message}
          </div>
        ) : null}

        {registrationsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Failed to load registrations: {registrationsError.message}
          </div>
        ) : null}

        <form className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <label className="block text-sm font-black text-slate-600">
            Filter by workshop
          </label>

          <select
            name="workshop"
            defaultValue={selectedWorkshopId}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800"
          >
            <option value="all">All workshops</option>
            {workshops.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.title || "Untitled workshop"}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
          >
            Apply filter
          </button>
        </form>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Confirmed Amount
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              USD {confirmedAmount.toFixed(2)}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Only manually confirmed paid registrations
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Confirmed Paid Records
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {confirmedPaid.length}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Excludes waived/free registrations
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Total Records
            </p>
            <p className="mt-4 text-4xl font-black text-slate-950">
              {registrations.length}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Current filtered registrations
            </p>
          </div>
        </div>

        <section className="space-y-5">
          {registrations.map((registration) => {
            const workshop = workshopById.get(registration.workshop_id);

            return (
              <article
                key={registration.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      {workshop?.title || "Unknown workshop"}
                    </p>

                    <h2 className="mt-2 text-xl font-black text-slate-950">
                      {registration.full_name || "Unnamed participant"}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {registration.email || "No email"}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black text-slate-400">
                          Registration
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeClass(
                            registration.registration_status
                          )}`}
                        >
                          {label(registration.registration_status)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black text-slate-400">
                          Payment
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeClass(
                            registration.payment_status
                          )}`}
                        >
                          {label(registration.payment_status)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black text-slate-400">
                          Amount
                        </p>
                        <p className="mt-2 font-black text-slate-900">
                          {money(
                            registration.amount_received,
                            registration.payment_currency
                          )}
                        </p>
                      </div>
                    </div>

                    {registration.payment_note ? (
                      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-black text-blue-700">
                          Payment message / note
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                          {registration.payment_note}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {registration.payment_link ? (
                        <a
                          href={registration.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800"
                        >
                          Open payment link
                        </a>
                      ) : null}

                      {registration.receipt_url ? (
                        <a
                          href={registration.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                          View uploaded receipt
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={paymentActions.handleRegistrationManagementAction}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <input
                      type="hidden"
                      name="registration_id"
                      value={registration.id}
                    />

                    <h3 className="text-lg font-black text-slate-950">
                      Payment actions
                    </h3>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-black text-slate-700">
                        Edit status
                      </p>

                      <label className="mt-3 block text-xs font-black text-slate-500">
                        Registration status
                      </label>
                      <select
                        name="registration_status"
                        defaultValue={
                          registration.registration_status || "pending"
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <label className="mt-3 block text-xs font-black text-slate-500">
                        Payment status
                      </label>
                      <select
                        name="payment_status"
                        defaultValue={registration.payment_status || "pending"}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                      >
                        <option value="pending">Unpaid / Pending</option>
                        <option value="instructions_sent">
                          Instructions Sent
                        </option>
                        <option value="under_review">Under Review</option>
                        <option value="confirmed">Confirmed Paid</option>
                        <option value="waived">Waived</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <button
                        type="submit"
                        name="intent"
                        value="save_statuses"
                        className="mt-4 w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-black text-white hover:bg-slate-700"
                      >
                        Save status changes
                      </button>
                    </div>

                    <label className="mt-4 block text-sm font-black text-slate-600">
                      Payment link
                    </label>
                    <input
                      name="payment_link"
                      defaultValue={registration.payment_link || ""}
                      placeholder="https://... or leave empty for non-link payment"
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
                    />

                    <label className="mt-4 block text-sm font-black text-slate-600">
                      Amount received
                    </label>
                    <input
                      name="amount_received"
                      type="number"
                      step="0.01"
                      defaultValue={registration.amount_received || 0}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
                    />

                    <label className="mt-4 block text-sm font-black text-slate-600">
                      Currency
                    </label>
                    <input
                      name="payment_currency"
                      defaultValue={registration.payment_currency || "USD"}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
                    />

                    <label className="mt-4 block text-sm font-black text-slate-600">
                      Message / internal note
                    </label>
                    <textarea
                      name="payment_note"
                      defaultValue={registration.payment_note || ""}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold"
                    />

                    <div className="mt-5 space-y-3">
                      <button
                        type="submit"
                        name="intent"
                        value="send_payment_message"
                        className="w-full rounded-3xl bg-blue-700 px-6 py-5 text-lg font-black text-white"
                      >
                        Send payment instruction
                      </button>

                      <button
                        type="submit"
                        name="intent"
                        value="record_payment_received"
                        className="w-full rounded-3xl bg-orange-600 px-6 py-5 text-lg font-black text-white"
                      >
                        Record payment info received
                      </button>

                      <button
                        type="submit"
                        name="intent"
                        value="confirm_payment"
                        className="w-full rounded-3xl bg-emerald-700 px-6 py-5 text-lg font-black text-white"
                      >
                        Confirm payment and unlock access
                      </button>

                      <button
                        type="submit"
                        name="intent"
                        value="waive_payment"
                        className="w-full rounded-3xl border border-slate-300 bg-white px-6 py-4 text-sm font-black text-slate-700"
                      >
                        Waive payment and unlock
                      </button>
                    </div>
                  </form>
                </div>
              </article>
            );
          })}

          {registrations.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-400 shadow-sm ring-1 ring-slate-200">
              No registrations found.
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}