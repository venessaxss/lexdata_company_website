export const revalidate = 0;
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmRegistration } from "@/app/admin/registrations/actions";

export const dynamic = "force-dynamic";

export default async function ManagerRegistrationsPage() {
  const admin = createAdminClient();

  const { data: registrations, error } = await admin
    .from("workshop_registrations")
    .select(`
      id,
      full_name,
      email,
      workshop_id,
      registration_status,
      payment_status,
      receipt_url,
      workshops (
        title,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("registrations error:", error);
  }

  const list = registrations ?? [];

  async function handleConfirm(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    await confirmRegistration(id);
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-black mb-6">
        Manager Registrations
      </h1>

      <div className="space-y-3">
        {list.map((r: any) => (
          <div
            key={r.id}
            className="rounded-xl bg-white p-4 shadow flex justify-between"
          >
            {/* LEFT SIDE */}
            <div>
              <p className="font-black">{r.full_name}</p>
              <p className="text-sm text-slate-500">{r.email}</p>

              <p className="text-sm font-bold mt-2">
                {r.workshops?.title ?? "Unknown Workshop"}
              </p>

              <p className="text-xs mt-2 text-slate-600">
                {r.registration_status} / {r.payment_status}
              </p>

              {r.receipt_url ? (
                <a
                  href={r.receipt_url}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  View Receipt
                </a>
              ) : null}
            </div>

            {/* RIGHT SIDE */}
            <form action={handleConfirm}>
              <input type="hidden" name="id" value={r.id} />
              <button
                type="submit"
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                Confirm
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}