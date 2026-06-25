import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();

  const cards = [
    {
      title: "Courses",
      href: "/admin/courses",
      description: "Create, edit, publish, and manage LexData courses.",
    },
    {
      title: "Site Content",
      href: "/admin/content",
      description: "Edit homepage text, about text, service copy, and page content.",
    },
    {
      title: "Users",
      href: "/admin/users",
      description: "Manage users, roles, instructors, students, and admins.",
    },
    {
      title: "Promotions",
      href: "/admin/promotions",
      description: "Manage dynamic banners, campaign messages, and homepage promotions.",
    },
    {
      title: "Media",
      href: "/admin/media",
      description: "Manage images, videos, galleries, and visual website spaces.",
    },
    {
      title: "Session Highlights",
      href: "/admin/highlights",
      description: "Add previous sessions, workshop pictures, videos, statistics, and event highlights.",
    },
    {
     title: "Team Members",
     href: "/admin/team-members",
     description:"Add team member photos, roles, affiliations, and homepage featured profiles.",
},

    
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="font-semibold text-blue-700">LexData Admin</p>

          <h1 className="mt-3 text-4xl font-bold text-slate-950">
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Manage courses, website content, users, promotions, images, and
            video spaces for the LexData learning platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h2 className="text-xl font-bold text-slate-950">
                {card.title}
              </h2>

              <p className="mt-2 text-slate-600">
                {card.description}
              </p>

              <p className="mt-5 font-semibold text-blue-700">
                Open →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}