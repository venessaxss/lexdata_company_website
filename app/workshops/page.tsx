import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function WorkshopsPage() {
  const supabase = await createClient();

  const { data: workshops } = await supabase
    .from("workshops")
    .select("id,title,slug,short_description,cover_url,level,language")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live workshops</h1>
          <p className="mt-2 text-slate-600">Register for live sessions, bootcamps, and speaker-led training.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {(workshops ?? []).map((workshop: any) => (
          <Link key={workshop.id} href={`/workshops/${workshop.slug}`} className="card overflow-hidden hover:-translate-y-1 hover:shadow-md">
            <div className="h-40 bg-slate-200">
              {workshop.cover_url ? <img src={workshop.cover_url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">{workshop.level} · {workshop.language}</p>
              <h2 className="mt-2 text-xl font-semibold">{workshop.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{workshop.short_description}</p>
            </div>
          </Link>
        ))}
        {(!workshops || workshops.length === 0) ? <div className="card p-6 text-slate-600">No workshops published yet.</div> : null}
      </div>
    </section>
  );
}
