import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/app/checkout/actions";

function money(cents: number, currency: string) {
  if (!cents || cents <= 0) return "Free";
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: workshop } = await supabase
    .from("workshops")
    .select("id,title,slug,short_description,intro,cover_url,level,language")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!workshop) notFound();

  const { data: sessions } = await supabase
    .from("workshop_sessions")
    .select("id,title,starts_at,ends_at,capacity,meeting_url,location,price_cents,currency")
    .eq("workshop_id", workshop.id)
    .eq("is_published", true)
    .order("starts_at");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="card overflow-hidden">
        <div className="h-64 bg-slate-200">
          {workshop.cover_url ? <img src={workshop.cover_url} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-8">
          <p className="text-sm text-slate-500">{workshop.level} · {workshop.language}</p>
          <h1 className="mt-2 text-4xl font-bold">{workshop.title}</h1>
          <p className="mt-4 text-lg text-slate-600">{workshop.short_description}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[0.65fr_0.35fr]">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold">Workshop introduction</h2>
          <p className="mt-4 whitespace-pre-line text-slate-700">{workshop.intro}</p>
        </div>

        <aside className="card p-6">
          <h2 className="font-semibold">Available sessions</h2>
          <div className="mt-4 space-y-4">
            {(sessions ?? []).map((session: any) => (
              <div key={session.id} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{session.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(session.starts_at).toLocaleString()} – {new Date(session.ends_at).toLocaleTimeString()}
                </p>
                <p className="mt-2 text-sm font-medium">{money(session.price_cents, session.currency)}</p>
                <form action={createCheckout} className="mt-3">
                  <input type="hidden" name="product_type" value="workshop" />
                  <input type="hidden" name="product_id" value={session.id} />
                  <button className="btn-primary w-full">Register / Pay</button>
                </form>
              </div>
            ))}
            {(!sessions || sessions.length === 0) ? <p className="text-sm text-slate-600">No upcoming sessions yet.</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
