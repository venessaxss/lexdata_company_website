import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminRegistrationsPage() {
  const admin = createAdminClient();

  const { data: registrations } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      full_name,
      email,
      workshop_id,
      registration_status,
      payment_status,
      receipt_url,
      amount_received,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="p-6">
      <h1 className="text-xl font-black mb-6">Registrations</h1>

      <div className="space-y-3">
        {(registrations ?? []).map((r) => (
          <div
            key={r.id}
            className="rounded-xl bg-white p-4 shadow"
          >
            <p className="font-black">{r.full_name}</p>
            <p className="text-sm text-slate-500">{r.email}</p>

            <p className="text-sm mt-2">
              {r.workshops?.title}
            </p>

            <p className="text-xs mt-2">
              Status: {r.registration_status} / {r.payment_status}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}