import { createClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-500">Our Team</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Meet the LexData Team
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Trainers, researchers, speakers, and managers behind our courses and workshops.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(members ?? []).map((member) => (
          <article
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                className="h-48 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                No photo
              </div>
            )}

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {member.full_name}
            </h2>

            {member.role_title ? (
              <p className="mt-1 text-sm font-medium text-slate-500">
                {member.role_title}
              </p>
            ) : null}

            {member.bio ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {member.bio}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}