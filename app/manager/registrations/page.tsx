import { createAdminClient } from "@/lib/supabase/admin";
import {
  confirmRegistration,
  rejectRegistration,
  addManagerNote,
} from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";

export default async function ManagerRegistrationsPage() {
  const admin = createAdminClient();

  const { data: registrations } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      full_name,
      email,
      registration_status,
      payment_status,
      receipt_url,
      manager_note,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  const list = registrations ?? [];

  return (
    <main className="p-6">
      <h1 className="text-xl font-black mb-6">Manager Control Panel</h1>

      <div className="space-y-4">
        {list.map((r: any) => (
          <div key={r.id} className="bg-white p-4 rounded-xl shadow">

            {/* INFO */}
            <div className="mb-3">
              <p className="font-black">{r.full_name}</p>
              <p className="text-sm text-slate-500">{r.email}</p>

              <p className="text-sm font-bold mt-2">
                {r.workshops?.title ?? "Unknown Workshop"}
              </p>

              <p className="text-xs mt-1">
                {r.registration_status} / {r.payment_status}
              </p>

              {r.manager_note && (
                <p className="text-xs mt-2 text-blue-600">
                  Note: {r.manager_note}
                </p>
              )}

              {r.receipt_url && (
                <a
                  href={r.receipt_url}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  View Receipt
                </a>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <form action={confirmRegistration.bind(null, r.id)}>
                <button className="bg-green-600 text-white px-3 py-1 rounded">
                  Confirm
                </button>
              </form>

              <form action={rejectRegistration.bind(null, r.id)}>
                <button className="bg-red-600 text-white px-3 py-1 rounded">
                  Reject
                </button>
              </form>

              <form
                action={async (formData: FormData) => {
                  "use server";
                  const note = String(formData.get("note"));
                  await addManagerNote(r.id, note);
                }}
              >
                <input
                  name="note"
                  placeholder="Add note..."
                  className="border px-2 py-1 text-sm rounded"
                />
                <button className="ml-2 bg-black text-white px-2 py-1 rounded text-sm">
                  Save
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}