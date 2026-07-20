import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegisteredWorkshop = {
  id: string;
  workshop_id?: string | null;
  workshop_slug?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  created_at?: string | null;
  workshops?: {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    level?: string | null;
    language?: string | null;
    short_description?: string | null;
    summary?: string | null;
    start_date?: string | null;
    date?: string | null;
    duration?: string | null;
    format?: string | null;
    image_url?: string | null;
    cover_url?: string | null;
    thumbnail_url?: string | null;
  } | null;
};

function getWorkshopSlug(item: RegisteredWorkshop) {
  return item.workshops?.slug || item.workshop_slug || null;
}

function getWorkshopTitle(item: RegisteredWorkshop) {
  return item.workshops?.title || "Workshop";
}

function getWorkshopDescription(item: RegisteredWorkshop) {
  return (
    item.workshops?.short_description ||
    item.workshops?.summary ||
    "Workshop details will be updated soon."
  );
}

function getWorkshopDate(item: RegisteredWorkshop) {
  return item.workshops?.start_date || item.workshops?.date || "TBA";
}

function getWorkshopTimeText(item: RegisteredWorkshop) {
  const date = getWorkshopDate(item);
  const duration = item.workshops?.duration;

  if (duration && date !== "TBA") {
    return `${date} · ${duration}`;
  }

  if (duration) {
    return duration;
  }

  return `Time ${date}`;
}

function getCoverImage(item: RegisteredWorkshop) {
  return (
    item.workshops?.image_url ||
    item.workshops?.cover_url ||
    item.workshops?.thumbnail_url ||
    null
  );
}

function hasPaidAccess(item: RegisteredWorkshop) {
  return (
    item.payment_status === "confirmed" ||
    item.payment_status === "paid" ||
    item.status === "approved" ||
    item.status === "confirmed" ||
    item.status === "paid"
  );
}

export default async function RegisteredWorkshopsPage() {
  noStore();

  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/unauthorized");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops (
        id,
        title,
        slug,
        level,
        language,
        short_description,
        summary,
        start_date,
        date,
        duration,
        format,
        image_url,
        cover_url,
        thumbnail_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as RegisteredWorkshop[];

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tight text-slate-950">
          Registered workshops
        </h1>

        <p className="mt-5 text-xl text-slate-600">
          Live sessions and training workshops you registered for.
        </p>
      </div>

      {error ? (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      ) : null}

      {registrations.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            No registered workshops yet
          </h2>

          <p className="mt-3 text-slate-600">
            After you register for a workshop, it will appear here.
          </p>

          <Link prefetch={false}
            href="/workshops"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Browse workshops
          </Link>
        </section>
      ) : (
        <section className="grid gap-6">
          {registrations.map((item) => {
            const slug = getWorkshopSlug(item);
            const href = slug ? `/workshops/${slug}` : null;
            const paidAccess = hasPaidAccess(item);
            const coverImage = getCoverImage(item);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={getWorkshopTitle(item)}
                      className="h-64 w-full object-cover lg:h-full"
                    />
                  ) : (
                    <div className="h-64 w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 lg:h-full" />
                  )}

                  <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                          {item.status || "registered"}
                        </span>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${
                            paidAccess
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {paidAccess ? "Access unlocked" : "Payment pending"}
                        </span>
                      </div>

                      <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                        {getWorkshopTitle(item)}
                      </h2>

                      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                        {getWorkshopDescription(item)}
                      </p>

                      <div className="mt-5 grid gap-2 text-base text-slate-600">
                        <p>
                          <strong>Time:</strong> {getWorkshopTimeText(item)}
                        </p>

                        <p>
                          <strong>Format:</strong>{" "}
                          {item.workshops?.format || "Online"}
                        </p>

                        <p>
                          <strong>Payment:</strong>{" "}
                          {item.payment_status || "pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3">
                      {href ? (
                        <Link prefetch={false}
                          href={href}
                          className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-50"
                        >
                          Workshop page
                        </Link>
                      ) : (
                        <span className="rounded-2xl border border-slate-200 bg-slate-100 px-7 py-4 text-center text-base font-black text-slate-400">
                          Missing workshop link
                        </span>
                      )}

                      {!paidAccess ? (
                        <Link prefetch={false}
                          href="/dashboard/messages"
                          className="rounded-2xl bg-slate-950 px-7 py-4 text-center text-base font-black text-white hover:bg-slate-700"
                        >
                          Payment message
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}