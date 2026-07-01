import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWorkshopRegistration } from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Registration = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_note?: string | null;
  payment_link?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
  payment_confirmed_at?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
  workshops?: {
    title?: string | null;
    slug?: string | null;
    price?: number | null;
    currency?: string | null;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function requireManagerOrAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/registrations");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }
}

function formatWorkshopPrice(registration: Registration) {
  const price = registration.workshops?.price ?? 0;
  const currency = registration.workshops?.currency || "USD";

  if (!price) return "Not set / free";

  return `${currency} ${price}`;
}

export default async function ManagerRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();

  await requireManagerOrAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops:workshop_id (
        title,
        slug,
        price,
        currency
      )
    `
    )
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as Registration[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/manager"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to manager dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Manager Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Registrations & Manual Payments
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Review workshop registrations and manually update payment status,
          payment method, transfer reference, notes, and access confirmation.
          This page is not connected to Stripe.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {registrations.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            No registrations yet
          </h2>
          <p className="mt-2 text-slate-600">
            Workshop registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map((registration) => (
            <article
              key={registration.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Registration
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {registration.workshops?.title || "Workshop"}
                  </h2>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        Name:
                      </span>{" "}
                      {registration.full_name || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Email:
                      </span>{" "}
                      {registration.email || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Registration status:
                      </span>{" "}
                      {registration.status || "pending"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Payment status:
                      </span>{" "}
                      {registration.payment_status || "pending"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Workshop price:
                      </span>{" "}
                      {formatWorkshopPrice(registration)}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Received:
                      </span>{" "}
                      {registration.payment_currency || "USD"}{" "}
                      {registration.amount_received ?? 0}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Method:
                      </span>{" "}
                      {registration.payment_method || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Reference:
                      </span>{" "}
                      {registration.payment_reference || "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Submitted:
                      </span>{" "}
                      {formatDate(registration.created_at)}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Confirmed:
                      </span>{" "}
                      {formatDate(registration.payment_confirmed_at)}
                    </p>
                  </div>

                  {registration.workshops?.slug ? (
                    <Link
                      href={`/workshops/${registration.workshops.slug}`}
                      className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open workshop page
                    </Link>
                  ) : null}
                </div>

                <form
                  action={updateWorkshopRegistration}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <input type="hidden" name="id" value={registration.id} />
                  <input
                    type="hidden"
                    name="back_to"
                    value="/manager/registrations"
                  />

                  <h3 className="text-lg font-black text-slate-950">
                    Manual Payment Update
                  </h3>

                  <div className="mt-4 grid gap-4">
                    <select
                      name="status"
                      defaultValue={registration.status || "pending"}
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >
                      <option value="pending">Registration pending</option>
                      <option value="approved">Approved</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      name="payment_status"
                      defaultValue={registration.payment_status || "pending"}
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >
                      <option value="not_required">Not required</option>
                      <option value="pending">Payment pending</option>
                      <option value="instructions_sent">
                        Instructions sent
                      </option>
                      <option value="under_review">Under review</option>
                      <option value="confirmed">Confirmed / paid</option>
                      <option value="waived">Waived / sponsored</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>

                    <select
                      name="payment_method"
                      defaultValue={registration.payment_method || ""}
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >
                      <option value="">Choose method</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="wechat">WeChat</option>
                      <option value="alipay">Alipay</option>
                      <option value="invoice">Invoice</option>
                      <option value="sponsored">Sponsored / waived</option>
                      <option value="manual">Other manual method</option>
                    </select>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        name="amount_received"
                        type="number"
                        step="0.01"
                        defaultValue={registration.amount_received ?? 0}
                        placeholder="Amount received"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />

                      <input
                        name="payment_currency"
                        defaultValue={registration.payment_currency || "USD"}
                        placeholder="Currency"
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      />
                    </div>

                    <input
                      name="payment_reference"
                      defaultValue={registration.payment_reference || ""}
                      placeholder="Transaction/reference number"
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    />

                    <input
                      name="payment_link"
                      defaultValue={registration.payment_link || ""}
                      placeholder="Payment instruction/link"
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    />

                    <textarea
                      name="payment_note"
                      rows={3}
                      defaultValue={registration.payment_note || ""}
                      placeholder="Payment note visible to user"
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    />

                    <textarea
                      name="admin_note"
                      rows={3}
                      defaultValue={registration.admin_note || ""}
                      placeholder="Internal note"
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      Save payment update
                    </button>
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}