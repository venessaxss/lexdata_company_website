import { createAdminClient } from "@/lib/supabase/admin";
import DynamicHomeShowcaseClient from "./DynamicHomeShowcaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Notice = {
  id: string;
  title?: string | null;
  summary?: string | null;
  notice_type?: string | null;
};

export default async function DynamicHomeShowcase() {
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const [
    workshopsResult,
    registrationsResult,
    usersResult,
    noticesResult,
    featuredNoticesResult,
  ] = await Promise.all([
    supabase.from("workshops").select("id", { count: "exact", head: true }),

    supabase
      .from("workshop_registrations")
      .select("id", { count: "exact", head: true }),

    supabase.from("profiles").select("id", { count: "exact", head: true }),

    supabase
      .from("notices")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .lte("publish_at", now)
      .or(`expire_at.is.null,expire_at.gte.${now}`),

    supabase
      .from("notices")
      .select("id, title, summary, notice_type")
      .eq("is_published", true)
      .eq("is_featured", true)
      .lte("publish_at", now)
      .or(`expire_at.is.null,expire_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = {
    workshops: workshopsResult.count ?? 0,
    registrations: registrationsResult.count ?? 0,
    users: usersResult.count ?? 0,
    notices: noticesResult.count ?? 0,
  };

  const notices = (featuredNoticesResult.data ?? []) as Notice[];

  return <DynamicHomeShowcaseClient stats={stats} notices={notices} />;
}