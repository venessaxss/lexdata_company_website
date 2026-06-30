import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const adminCards = [
  {
    title: "Courses",
    description: "Create, edit, and manage course content.",
    href: "/admin/courses",
  },
  {
    title: "Workshops",
    description: "Manage workshops, live sessions, and training programs.",
    href: "/admin/workshops",
  },
  {
    title: "Homepage Hero",
    description: "Edit homepage background photos, videos, and carousel slides.",
    href: "/admin/hero",
  },
  {
    title: "Homepage Highlights",
    description: "Manage homepage highlight blocks and promotional sections.",
    href: "/admin/highlights",
  },
  {
    title: "Media Library",
    description: "Manage uploaded images, banners, and website media.",
    href: "/admin/media",
  },
  {
    title: "Promotions",
    description: "Manage homepage promotions and featured content.",
    href: "/admin/promotions",
  },
  {
    title: "Team Management",
    description: "Edit team members, profile photos, bios, roles, and visibility.",
    href: "/admin/team",
  },
  {
    title: "Users and Roles",
    description: "Assign student, speaker, manager, and admin roles.",
    href: "/admin/users",
  },
  {
    title: "Content Management",
    description: "Manage general website content and editable sections.",
    href: "/admin/content",
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
          Manage LexData courses, workshops, homepage content, users, team
          members, media, and promotional sections from one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={card.href}
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