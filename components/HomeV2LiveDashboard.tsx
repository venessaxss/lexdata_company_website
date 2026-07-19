import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomeV2LiveDashboard() {
  const admin = createAdminClient();

  let stats = [
    { label: "Published courses", value: 0, href: "/courses" },
    { label: "Active workshops", value: 0, href: "/workshops" },
    { label: "Video highlights", value: 0, href: "/" },
    { label: "Team members", value: 0, href: "/team" },
  ];

  try {
    const [courses, workshops, videos, team] = await Promise.all([
      admin
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),

      admin
        .from("workshops")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),

      admin
        .from("homepage_videos")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),

      admin
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    stats = [
      { label: "Published courses", value: courses.count ?? 0, href: "/courses" },
      { label: "Active workshops", value: workshops.count ?? 0, href: "/workshops" },
      { label: "Video highlights", value: videos.count ?? 0, href: "/" },
      { label: "Team members", value: team.count ?? 0, href: "/team" },
    ];
  } catch (error) {
    console.error("HomeV2LiveDashboard error:", error);
  }

  return (
    <section className="lx2-integrated-dashboard">
      <div className="lx2-integrated-dashboard-grid">
        {stats.map((item) => (
          <Link key={item.label} href={item.href} className="lx2-integrated-stat">
            <span>{item.label}</span>
            <b>{item.value}</b>
            <p>Open -&gt;</p>
          </Link>
        ))}
      </div>
    </section>
  );
}