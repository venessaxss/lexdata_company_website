import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomeV2LiveDashboard() {
  const admin = createAdminClient();

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

  const stats = [
    {
      label: "Published courses",
      value: courses.count ?? 0,
      href: "/courses",
    },
    {
      label: "Active workshops",
      value: workshops.count ?? 0,
      href: "/workshops",
    },
    {
      label: "Video highlights",
      value: videos.count ?? 0,
      href: "/",
    },
    {
      label: "Team members",
      value: team.count ?? 0,
      href: "/team",
    },
  ];

  return (
    <section className="v2-section v2-dashboard-section">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-label">Live LexData dashboard</p>
            <h2>Courses, workshops, videos, and team activity in one view.</h2>
            <p>
              A public snapshot of LexData learning, media, and collaboration
              activity.
            </p>
          </div>
        </div>

        <div className="v2-dashboard-grid">
          {stats.map((item) => (
            <Link key={item.label} href={item.href} className="v2-stat-card">
              <span>{item.label}</span>
              <b>{item.value}</b>
              <p>Open -&gt;</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}