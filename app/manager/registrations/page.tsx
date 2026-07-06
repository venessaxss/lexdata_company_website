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

  const { data: reg } = await admin
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

  const isUnlocked = (sid: string) =>
    access?.some((a: any) => a.session_id === sid);

  return (
    <main className="p-6">

      <h1>{workshop.title}</h1>

      {/* REGISTER */}
      {!reg && (
        <form action={async () => {
          "use server";
          const admin = createAdminClient();

          await admin.from("workshop_registrations").insert({
            workshop_id: workshop.id,
            user_id: user.id,
            registration_status: "pending",
            payment_status: "pending",
          });
        }}>
          <button>Register</button>
        </form>
      )}

      {/* SESSIONS */}
      {sessions?.map((s: any) => (
        <div key={s.id}>
          <h3>{s.title}</h3>

          {isUnlocked(s.id) ? (
            <div>
              {s.media_type === "video" && <video src={s.media_url} controls />}
              {s.media_type === "image" && <img src={s.media_url} />}
              {s.media_type === "pdf" && <a href={s.media_url}>PDF</a>}
            </div>
          ) : (
            <p>Locked</p>
          )}
        </div>
      ))}

    </main>
  );
}