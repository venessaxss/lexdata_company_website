import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  confirmRegistration,
  rejectRegistration,
} from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Manager registrations.
 * GATE: requireRole(["manager"]) — managers AND admins pass (admins pass
 * every role check via hasRoleAccess). A logged-in manager can NEVER be
 * bounced to /login from here; only a truly signed-out visitor is
 * redirected (by middleware / requireUser), which is correct.
 */
const PAGE_SIZES = [10, 25, 50, 100];

export default async function ManagerRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requireRole(["manager"]);

  const params = await searchParams;
  const pageSize = PAGE_SIZES.includes(Number(params.pageSize))
    ? Number(params.pageSize)
    : 25;
  const requestedPage = Math.max(1, Number(params.page) || 1);

  const admin = createAdminClient();

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: registrations, error, count } = await admin
    .from("workshop_registrations")
    .select(
      `
      id,
      full_name,
      email,
      workshop_id,
      registration_status,
      payment_status,
      receipt_url,
      created_at,
      workshops (
        title,
        slug
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageHref = (p: number, size: number = pageSize) =>
    `/manager/registrations?page=${p}&pageSize=${size}`;

  if (error) {
    console.error("manager registrations error:", error);
  }

  const list = registrations ?? [];

  async function handleConfirm(formData: FormData) {
    "use server";
    await confirmRegistration(String(formData.get("id")));
  }

  async function handleReject(formData: FormData) {
    "use server";
    await rejectRegistration(String(formData.get("id")));
  }

  const statusBadge = (value?: string | null) => {
    const v = (value ?? "pending").toLowerCase();
    const color =
      v === "confirmed" || v === "waived"
        ? "bg-green-100 text-green-800"
        : v === "rejected" || v === "cancelled"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}
      >
        {v}
      </span>
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950">
            Registration management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Confirm or reject workshop registrations and check payment
            receipts. {total} total.
          </p>
        </div>
        <Link
          href="/manager"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          ← Manager dashboard
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load registrations: {error.message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {list.length === 0 && !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No registrations yet.
          </div>
        ) : null}

        {list.map((r: any) => (
          <div
            key={r.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="font-black text-slate-950">{r.full_name}</p>
              <p className="text-sm text-slate-500">{r.email}</p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                {r.workshops?.title ?? "Unknown workshop"}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                Registration: {statusBadge(r.registration_status)}
                Payment: {statusBadge(r.payment_status)}
              </p>
              {r.receipt_url ? (
                <a
                  href={r.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-blue-600 underline"
                >
                  View receipt
                </a>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No receipt uploaded</p>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <form action={handleConfirm}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                >
                  Confirm
                </button>
              </form>
              <form action={handleReject}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- pagination ---------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              ← Previous
            </Link>
          ) : (
            <span className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-300">
              ← Previous
            </span>
          )}

          <span className="px-2 text-sm font-semibold text-slate-600">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-300">
              Next →
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm">
          <span className="mr-1 font-semibold text-slate-500">Per page:</span>
          {PAGE_SIZES.map((size) => (
            <Link
              key={size}
              href={pageHref(1, size)}
              className={`rounded-lg px-2.5 py-1 font-bold ${
                size === pageSize
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
