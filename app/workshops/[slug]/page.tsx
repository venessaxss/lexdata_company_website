import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function WorkshopPage({ params }: any) {
  const { slug } = await params;

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: workshop } = await admin
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!workshop) notFound();

  const { data: registration } = await admin
    .from("workshop_registrations")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("user_id", user?.id)
    .maybeSingle();

  const { data: sessions } = await admin
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id);

  const { data: access } = await admin
    .from("session_access_logs")
    .select("*")
    .eq("user_id", user?.id);

  const isUnlocked = (sessionId: string) =>
    access?.some((a: any) => a.session_id === sessionId);

  return (
    <main className="p-6">

      <h1 className="text-3xl font-bold">{workshop.title}</h1>

      {/* REGISTER BUTTON */}
      {!registration && (
        <form action={async () => {
          "use server";
          const admin = createAdminClient();

          await admin.from("workshop_registrations").insert({
            workshop_id: workshop.id,
            user_id: user.id,
            registration_status: "pending",
            payment_status: workshop.price === 0 ? "waived" : "pending",
          });
        }}>
          <button className="bg-black text-white px-4 py-2 mt-4">
            Register
          </button>
        </form>
      )}

      {/* REG STATUS */}
      <p className="mt-4">
        Status: {registration?.registration_status || "Not registered"}
      </p>

      {/* SESSIONS */}
      <div className="mt-6 space-y-4">
        {sessions?.map((s: any) => (
          <div key={s.id} className="border p-4 rounded">

            <h2 className="font-bold">{s.title}</h2>
            <p>{s.description}</p>

            {isUnlocked(s.id) ? (
              <div className="mt-2">
                {s.media_type === "video" && (
                  <video src={s.media_url} controls />
                )}
                {s.media_type === "image" && (
                  <img src={s.media_url} />
                )}
                {s.media_type === "pdf" && (
                  <a href={s.media_url} className="text-blue-600">
                    Download PDF
                  </a>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Locked</p>
            )}

          </div>
        ))}
      </div>

    </main>
  );
}