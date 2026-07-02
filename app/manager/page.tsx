import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = {
  full_name?: string | null;
  role?: string | null;
};

const managerCards = [
  {
    title: "Workshop Registrations",
    description:
      "View workshop registration records, check payment status, add payment links, and confirm access.",
    href: "/manager/registrations",
  },
  {
  title: "Workshop Status Control",
  description:
    "Open, close, terminate recruitment, and manage workshop progress status.",
  href: "/manager/workshops",
},
  {
    title: "Send Messages",
    description:
      "Send messages to all users or selected role groups such as members, speakers, managers, or admins.",
    href: "/dashboard/messages/send",
  },
  {
    title: "Message Box",
    description:
      "Open your message box to view received messages, workshop notices, payment updates, and team messages.",
    href: "/dashboard/messages",
  },
  {
  title: "Notice Center",
  description:
    "Publish and manage public notices, announcements, media releases, and homepage spotlight updates.",
  href: "/manager/notices",
},
  {
    title: "Workshops",
    description:
      "View public workshop pages and check how workshops appear to users.",
    href: "/workshops",
  },
  {
    title: "My Learning",
    description:
      "View your registered workshops, learning access, and unlocked session arrangements.",
    href: "/dashboard/my-learning",
  },
  {
    title: "Change Password",
    description: "Update the password for your LexData account.",
    href: "/dashboard/settings/password",
  },
  {
    title: "My Dashboard",
    description:
      "Open your personal dashboard for messages, learning, account settings, and member tools.",
    href: "/dashboard",
  },
  
];

export default async function ManagerPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const role =
  profile?.role === "student" ? "member" : profile?.role || "member";

  if (role !== "manager" && role !== "admin") {
    redirect("/dashboard");
  }

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Manager Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Manager Control Panel
        </h1>

        <p className="mt-4 max-w-2xl text-slate-600">
          Welcome{displayName ? `, ${displayName}` : ""}. Manage workshop
          registrations, payment confirmations, user messages, and member-facing
          workshop access from one place.
        </p>

        <p className="mt-3 text-sm font-semibold text-slate-500">
          Current role: {role}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {managerCards.map((card) => (
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