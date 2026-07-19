export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const adminCards = [
  {
    title: "Courses",
    description: "Create, edit, publish, and manage course content.",
    href: "/admin/courses",
  },
  {
  title: "Course Enrollments",
  description:
    "View course enrollment requests, approve course access, check payment status, and manage student participation.",
  href: "/admin/course-enrollments",
},
  {
    title: "Workshop Registrations",
    description:
      "View registration records submitted from public workshop pages.",
    href: "/manager/registrations",
  },
  {
  title: "Q&A Help Desk",
  description:
    "View all participant Q&A requests, answer them, close resolved issues, and manage support communication.",
  href: "/admin/live-help",
  },

  {
    title: "Workshops",
    description:
      "Create, edit, publish, delete, and manage workshops, sessions, subsessions, levels, materials, YouTube links, and Jianying links.",
    href: "/admin/workshops",
  },
  {
  title: "Member Profiles",
  description:
    "View member profile information including institution, profession, country, degree, and research interests.",
  href: "/admin/member-profiles",
},
  {
    title: "Send Messages",
    description:
      "Send messages to all users or selected role groups such as members, speakers, managers, staff, or admins.",
    href: "/dashboard/messages/send",
  },
  {
    title: "Message Box",
    description:
      "Open your message box to view received messages, workshop notices, payment updates, and team messages.",
    href: "/dashboard/messages",
  },
  {
    title: "Homepage Hero",
    description:
      "Edit homepage hero background images, uploaded videos, YouTube hero videos, buttons, and carousel slides.",
    href: "/admin/hero",
  },
  {
    title: "Homepage Video Spotlight",
    description:
      "Managed through Homepage Hero. Active video slides can appear as the separate autoplay homepage video section.",
    href: "/admin/hero",
  },
  {
  title: "Notice Center",
  description:
    "Publish website notices, announcements, media releases, images, audio, videos, and public updates.",
  href: "/manager/notices",
},
  {
    title: "Latest Workshop Videos",
    description:
      "Managed through Workshops. Add session videos or YouTube/Jianying links to show them in the homepage latest video section.",
    href: "/admin/workshops",
  },
  {
    title: "Team Management",
    description:
      "Edit team members, profile photos, bios, roles, and visibility.",
    href: "/admin/team",
  },
  {
    title: "Users and Roles",
    description: "Assign member, speaker, manager, staff, and admin roles.",
    href: "/admin/users",
  },
  {
    title: "Media Library",
    description: "Manage uploaded images, banners, and website media.",
    href: "/admin/media",
  },
  {
    title: "My Dashboard",
    description:
      "Open your personal dashboard for learning, messages, password settings, and account tools.",
    href: "/dashboard",
  },
  {
  title: "Overall Monitoring Board",
  description:
    "View registration statistics, payment statistics, website visit records, workshop status, course status, and user activity.",
  href: "/manager/monitor",
},
];

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Website Management
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Manage LexData courses, workshops, homepage hero slides, homepage
          video sections, team members, users, roles, messages, and uploaded
          media from one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={`${card.title}-${card.href}`}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-xl font-black text-slate-950">
              {card.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              {card.description}
            </p>

            <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              Open
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}