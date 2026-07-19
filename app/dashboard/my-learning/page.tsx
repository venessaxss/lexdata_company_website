import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearningRegistration = {
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

function formatDate(value?: string | null) {
  if (!value) return "TBA";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function getWorkshopSlug(item: LearningRegistration) {
  return item.workshops?.slug || item.workshop_slug || null;
}

function getCoverImage(item: LearningRegistration) {
  return (
    item.workshops?.image_url ||
    item.workshops?.cover_url ||
    item.workshops?.thumbnail_url ||
    null
  );
}

function hasPaidAccess(item: LearningRegistration) {
  return (
    item.payment_status === "confirmed" ||
    item.payment_status === "paid" ||
    item.status === "approved" ||
    item.status === "confirmed" ||
    item.status === "paid"
  );
}

export default async function MyLearningPage() {
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

  const registrations = (data ?? []) as LearningRegistration[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          -&gt;Back to dashboard
        </Link>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
          My Learning
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          View your registered workshops, payment status, and unlocked session
          arrangements.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

          <Link
            href="/workshops"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Browse workshops
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((item) => {
            const workshop = item.workshops;
            const slug = getWorkshopSlug(item);
            const href = slug ? `/workshops/${slug}` : null;
            const paidAccess = hasPaidAccess(item);
            const coverImage = getCoverImage(item);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={workshop?.title || "Workshop"}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100" />
                )}

                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {workshop?.level || "Workshop"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        paidAccess
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {paidAccess ? "Access unlocked" : "Payment pending"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-black text-slate-950">
                    {workshop?.title || "Workshop"}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {workshop?.short_description ||
                      workshop?.summary ||
                      "Workshop details will be updated soon."}
                  </p>

                  <div className="mt-5 grid gap-2 text-sm text-slate-600">
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate(workshop?.start_date || workshop?.date)}
                    </p>

                    <p>
                      <strong>Duration:</strong> {workshop?.duration || "TBA"}
                    </p>

                    <p>
                      <strong>Format:</strong> {workshop?.format || "Online"}
                    </p>

                    <p>
                      <strong>Registration:</strong>{" "}
                      {item.status || "registered"}
                    </p>

                    <p>
                      <strong>Payment:</strong>{" "}
                      {item.payment_status || "pending"}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {href ? (
                      <Link
                        href={href}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Open workshop
                      </Link>
                    ) : (
                      <span className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-500">
                        Missing workshop link
                      </span>
                    )}

                    {!paidAccess ? (
                      <Link
                        href="/dashboard/messages"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Payment message
                      </Link>
                    ) : null}
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