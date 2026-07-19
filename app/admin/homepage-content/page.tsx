import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getHomepageContentSlots,
  homepageContentDefaults,
} from "@/lib/homepage-content";
import { updateHomepageContentAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    redirect("/");
  }
}

export default async function AdminHomepageContentPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  await requireAdminOrManager();

  const params = await searchParams;
  const slotsMap = await getHomepageContentSlots();

  const slots = homepageContentDefaults
    .map((item) => slotsMap[item.key] ?? item)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
              Homepage editor
            </p>

            <h1 className="mt-3 text-4xl font-black text-slate-950">
              Edit homepage content
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600">
              Edit the hero, message slots, dashboard slots, and video slot
              cards shown on the homepage.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
            >
              View homepage
            </Link>

            <Link
              href="/admin"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Admin dashboard
            </Link>
          </div>
        </div>

        {params.message === "updated" ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
            Homepage content updated.
          </div>
        ) : null}

        <form action={updateHomepageContentAction} className="space-y-6">
          {slots.map((slot) => (
            <section
              key={slot.key}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <input type="hidden" name="key" value={slot.key} />

              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    {slot.key}
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {slot.label}
                  </h2>
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    name={`is_active_${slot.key}`}
                    defaultChecked={slot.is_active}
                  />
                  Active
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Label
                  </span>
                  <input
                    name={`label_${slot.key}`}
                    defaultValue={slot.label}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Sort order
                  </span>
                  <input
                    type="number"
                    name={`sort_order_${slot.key}`}
                    defaultValue={slot.sort_order}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">
                  Title / button text
                </span>
                <input
                  name={`title_${slot.key}`}
                  defaultValue={slot.title}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">
                  Body
                </span>
                <textarea
                  name={`body_${slot.key}`}
                  defaultValue={slot.body}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">
                  Link / href
                </span>
                <input
                  name={`href_${slot.key}`}
                  defaultValue={slot.href}
                  placeholder="/courses"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </section>
          ))}

          <div className="sticky bottom-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur">
            <button className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-base font-black text-white hover:bg-blue-800">
              Save homepage content
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}