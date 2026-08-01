import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireManagerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const managerCards = [
  {
    title: "Registration Command Center",
    description:
      "Review, confirm, reject, and message workshop registrants with pagination and status filters.",
    href: "/manager/registrations",
  },
  {
    title: "Course Registration Center",
    description:
      "Choose one course and manage its participants, payment status, and learning access.",
    href: "/manager/course-registrations",
  },
  {
    title: "Message Center",
    description:
      "Open your inbox and reply to participants or team members.",
    href: "/dashboard/messages",
  },
  {
    title: "Send Messages",
    description:
      "Send direct or broadcast messages to participants and roles.",
    href: "/dashboard/messages/send",
  },
  {
    title: "Payments",
    description:
      "Review payment receipts and workshop access status.",
    href: "/manager/payments",
  },
  {
    title: "Monitoring Board",
    description:
      "View registration, payment, workshop and user activity statistics.",
    href: "/manager/monitor",
  },
  {
    title: "Notices",
    description:
      "Publish public notices, announcements and media updates.",
    href: "/manager/notices",
  },
  {
    title: "Workshops",
    description:
      "Manage workshop operations, access, materials and video links.",
    href: "/manager/workshops",
  },
  {
    title: "Courses",
    description:
      "Open the admin course library and manage course content.",
    href: "/admin/courses",
  },
  {
    title: "Team",
    description:
      "Manage visible team profiles and member information.",
    href: "/manager/team",
  },
];

export default async function ManagerPage() {
  noStore();

  const auth = await requireManagerOrAdmin("/manager");

  const [
    pendingWorkshopResult,
    pendingCourseResult,
    unreadResult,
  ] = await Promise.all([
    auth.admin
      .from("workshop_registrations")
      .select("id", { count: "exact", head: true })
      .eq("registration_status", "pending"),

    auth.admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("registration_status", "pending"),

    auth.admin
      .from("user_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("is_read", false),
  ]);

  const pendingWorkshopRegistrations =
    pendingWorkshopResult.count || 0;

  const pendingCourseRegistrations =
    pendingCourseResult.count || 0;

  const unreadMessages = unreadResult.count || 0;

  return (
    <main
      className="min-h-screen bg-[#f8fafc] px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "128px" }}
    >
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
            Manager dashboard
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Operations board
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            One login session covers workshop and course registrations,
            payment approval, participant messages, and management tools.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              prefetch={false}
              href="/manager/registrations"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950"
            >
              {pendingWorkshopRegistrations} pending workshop registrations
            </Link>

            <Link
              prefetch={false}
              href="/manager/course-registrations"
              className="rounded-2xl bg-indigo-300 px-5 py-4 text-sm font-black text-slate-950"
            >
              {pendingCourseRegistrations} pending course registrations
            </Link>

            <Link
              prefetch={false}
              href="/dashboard/messages"
              className="rounded-2xl bg-[#8b93f8] px-5 py-4 text-sm font-black text-slate-950"
            >
              {unreadMessages} unread messages
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {managerCards.map((card) => (
            <Link
              prefetch={false}
              key={card.href}
              href={card.href}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {card.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {card.description}
              </p>

              <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                Open -&gt;
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}