import { createClient } from "@/lib/supabase/server";
import { updateAboutSection } from "@/app/admin/about/actions";

type SectionRow = {
  id: string;
  kicker: string | null;
  heading: string | null;
  body: string | null;
  items: string[] | null;
  is_active: boolean;
  sort: number;
};

const SECTION_HELP: Record<string, string> = {
  intro: "Hero: kicker + intro paragraph (the headline itself is fixed styling).",
  mission: "Left card: kicker, heading, paragraph.",
  why: "Right card checklist: one checklist line per row in Items.",
  aims: 'Three cards: each Items line is "Title | Body".',
  stance: "Purple band: text + one badge per Items line.",
  quote: "Closing quote: Body = the quote, first Items line = who said it.",
};

const DEFAULT_ORDER = ["intro", "mission", "why", "aims", "stance", "quote"];

export default async function AboutEditor({
  returnTo,
  message,
}: {
  returnTo: string;
  message?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("about_sections")
    .select("id,kicker,heading,body,items,is_active,sort")
    .order("sort", { ascending: true });

  const rows = (data ?? []) as SectionRow[];
  const known = new Set(rows.map((row) => row.id));
  const missing = DEFAULT_ORDER.filter((id) => !known.has(id));

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black text-slate-950">Edit About page</h1>
      <p className="mt-2 text-slate-600">
        Changes go live on <a className="underline" href="/about">/about</a>{" "}
        immediately. Both admins and managers can edit here.
      </p>

      {message ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {error || rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The <code>about_sections</code> table isn&rsquo;t set up yet
          {error ? ` (${error.message})` : ""}. Run{" "}
          <code>supabase/migrations/004_about_content.sql</code> in the
          Supabase SQL Editor, then reload this page. Until then, /about shows
          built-in default content.
        </div>
      ) : null}

      <div className="mt-8 grid gap-8">
        {rows.map((row) => (
          <form
            key={row.id}
            action={updateAboutSection}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="return_to" value={returnTo} />

            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-950">{row.id}</h2>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={row.is_active}
                />
                Visible
              </label>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {SECTION_HELP[row.id] ?? ""}
            </p>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kicker
                </label>
                <input
                  name="kicker"
                  defaultValue={row.kicker ?? ""}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Heading
                </label>
                <input
                  name="heading"
                  defaultValue={row.heading ?? ""}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Body
                </label>
                <textarea
                  name="body"
                  rows={3}
                  defaultValue={row.body ?? ""}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Items (one per line)
                </label>
                <textarea
                  name="items"
                  rows={4}
                  defaultValue={(row.items ?? []).join("\n")}
                  className="w-full rounded-xl border px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
            >
              Save {row.id}
            </button>
          </form>
        ))}
      </div>

      {missing.length > 0 && rows.length > 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Missing sections ({missing.join(", ")}): re-run migration 004 to
          restore their seeds.
        </p>
      ) : null}
    </section>
  );
}
