import { createAdminClient } from "@/lib/supabase/admin";
import {
  confirmRegistration,
  rejectRegistration,
  addManagerNote,
} from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";

export default async function ManagerRegistrationsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      full_name,
      email,
      registration_status,
      payment_status,
      receipt_url,
      manager_note,
      amount_received,
      payment_currency,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  const list = data ?? [];

  return (
    <main className="p-6">
      <h1>Manager Panel</h1>

      {list.map((r: any) => (
        <div key={r.id}>
          <p>{r.full_name}</p>
          <p>{r.email}</p>

          <p>{r.workshops?.title}</p>

          <p>{r.registration_status} / {r.payment_status}</p>

          {r.receipt_url && (
            <a href={r.receipt_url}>Receipt</a>
          )}

          <form action={confirmRegistration.bind(null, r.id)}>
            <button>Confirm</button>
          </form>

          <form action={rejectRegistration.bind(null, r.id)}>
            <button>Reject</button>
          </form>

          <form
            action={async (formData: FormData) => {
              "use server";
              const note = String(formData.get("note"));
              await addManagerNote(r.id, note);
            }}
          >
            <input name="note" placeholder="note" />
            <button>Save</button>
          </form>
        </div>
      ))}
    </main>
  );
}