import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const adminCards = [
  {
    title: "Registration Command Center",
    description: "Review new workshop registrations, confirm payment/access, reject incomplete records, and message registrants directly.",
    href: "/manager/registrations",
    tag: "Review + confirm",
  },
  {
    title: "Message Center",
    description: "Read admin inbox messages, reply to participants, and follow registration conversations.",
    href: "/dashboard/messages",
    tag: "Inbox + replies",
  },
  {
    title: "Send Messages",
    description: "Send messages to all users, specific role groups, or individual registrants/users.",
    href: "/dashboard/messages/send",
    tag: "Broadcast",
  },
  {
    title: "Courses",
    description: "Create, edit, publish, and manage course content.",
    href: "/admin/courses",
    tag: "Content",
  },
  {
    title: "Workshops",
    description: "Create, edit, publish, delete, and manage workshops, sessions, materials, and video links.",
    href: "/admin/workshops",
    tag: "Programs",
  },
  {
    title: "Member Profiles",
    description: "View member profile details and understand participant background.",
    href: "/admin/member-profiles",
    tag: "Members",
  },
  {
    title: "Notice Center",
    description: "Publish notices, media releases, images, videos, and public updates.",
    href: "/manager/notices",
    tag: "Public updates",
  },
  {
    title: "Team Management",
    description: "Edit team members, profile photos, bios, roles, and visibility.",
    href: "/admin/team",
    tag: "People",
  },
  {
    title: "Users and Roles",
    description: "Assign member, speaker, manager, staff, and admin roles.",
    href: "/admin/users",
    tag: "Access",
  },
  {
    title: "Media Library",
    description: "Manage uploaded images, banners, documents, and website media.",
    href: "/admin/media",
    tag: "Media",
  },
  {
    title: "Overall Monitoring Board",
    description: "View registration, payment, website visit, workshop, course, and user activity statistics.",
    href: "/manager/monitor",
    tag: "Analytics",
  },
  {
    title: "My Dashboard",
    description: "Open personal learning, messages, password settings, and account tools.",
    href: "/dashboard",
    tag: "Account",
  },
];

export default async function AdminPage() {
  noStore();
  const auth = await requireAdmin("/admin");

  const { count: pendingRegistrations } = await auth.admin
    .from("workshop_registrations")
    .select("id", { count: "exact", head: true })
    .eq("registration_status", "pending");

  const { count: unreadMessages } = await auth.admin
    .from("user_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("is_read", false);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-xl">
          <div className="grid gap-6 p-8 text-white lg:grid-cols-[1fr_360px] lg:p-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">Admin dashboard</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Website management cockpit</h1>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Confirm registrations, review submissions, send replies, broadcast messages, and manage LexData content from one clean dashboard.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Link href="/manager/registrations" className="rounded-[1.5rem] bg-white p-5 text-slate-950">
                <p className="text-3xl font-black">{pendingRegistrations ?? 0}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">pending registrations</p>
              </Link>
              <Link href="/dashboard/messages" className="rounded-[1.5rem] bg-[#8b93f8] p-5 text-slate-950">
                <p className="text-3xl font-black">{unreadMessages ?? 0}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-700">unread messages</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card) => (
            <Link key={`${card.title}-${card.href}`} href={card.href} className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-600">{card.tag}</span>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{card.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{card.description}</p>
              <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white group-hover:bg-[#8b93f8] group-hover:text-slate-950">Open -&gt;</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
