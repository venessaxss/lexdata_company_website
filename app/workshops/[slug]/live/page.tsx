import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { requireProfile, normalizeRole } from "@/lib/auth";
import { canAccessWorkshop } from "@/lib/access-control";
import LiveRoomClient from "@/components/livestream/LiveRoomClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function findRegistration(input: {
  admin: any;
  workshopId: string;
  userId: string;
  email?: string | null;
}) {
  const byUser = await input.admin
    .from("workshop_registrations")
    .select("*")
    .eq("workshop_id", input.workshopId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (byUser.data) return byUser.data;

  if (input.email) {
    const byEmail = await input.admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", input.workshopId)
      .ilike("email", input.email)
      .maybeSingle();

    if (byEmail.data) return byEmail.data;
  }

  return null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function WorkshopLivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();

  const { slug } = await params;
  const identity = await requireProfile(`/workshops/${slug}/live`);

  const { data: workshop } = await identity.admin
    .from("workshops")
    .select("id, title, slug, summary")
    .eq("slug", slug)
    .maybeSingle();

  if (!workshop) notFound();

  const { data: stream, error: streamError } = await identity.admin
    .from("workshop_live_streams")
    .select("*")
    .eq("workshop_id", workshop.id)
    .maybeSingle();

  const role = normalizeRole(identity.role);
  const isManager = role === "admin" || role === "manager";

  let registration: any = null;

  if (!isManager) {
    registration = await findRegistration({
      admin: identity.admin,
      workshopId: workshop.id,
      userId: identity.id,
      email: identity.email,
    });
  }

  const allowed = isManager || canAccessWorkshop(registration);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Protected workshop broadcast
              </p>
              <h1 className="mt-2 text-4xl font-black">{workshop.title}</h1>
              {workshop.summary ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workshop.summary}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/workshops/${workshop.slug}`}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black"
              >
                Workshop page
              </Link>
              {isManager ? (
                <Link
                  href="/manager/livestreams"
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                >
                  Manage livestream
                </Link>
              ) : null}
            </div>
          </div>

          {stream ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Status</p>
                <p className="mt-2 font-black">{stream.status}</p>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Starts</p>
                <p className="mt-2 font-black">
                  {formatDateTime(stream.scheduled_start)}
                </p>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Access</p>
                <p className={`mt-2 font-black ${allowed ? "text-emerald-700" : "text-red-700"}`}>
                  {allowed ? "Granted" : "Locked"}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {streamError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {streamError.message}
          </div>
        ) : !stream ? (
          <div className="rounded-[2rem] border border-dashed bg-white p-10 text-center">
            <h2 className="text-2xl font-black">Livestream not configured</h2>
          </div>
        ) : !allowed ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-2xl font-black text-red-800">
              Workshop access locked
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-red-700">
              Explicit revoked, blocked, denied, or suspended access overrides
              confirmed payment or registration.
            </p>
          </div>
        ) : (
          <LiveRoomClient
            streamId={stream.id}
            streamTitle={stream.title || workshop.title}
            initialStatus={stream.status || "scheduled"}
          />
        )}
      </div>
    </main>
  );
}
