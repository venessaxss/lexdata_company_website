import { createAdminClient } from "@/lib/supabase/admin";
import {
  workshopNotices as fallbackWorkshopNotices,
  type WorkshopNotice,
} from "@/content/workshopNotices";

type WorkshopNoticeRow = {
  id: string;
  title: string;
  summary: string | null;
  date_label: string | null;
  venue: string | null;
  poster_url: string | null;
  href: string | null;
  badge: string | null;
  sort_order: number | null;
};

export async function getPublicWorkshopNotices(): Promise<WorkshopNotice[]> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("workshop_notices")
      .select(
        "id, title, summary, date_label, venue, poster_url, href, badge, sort_order"
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Workshop notice load failed:", error.message);
      return fallbackWorkshopNotices;
    }

    if (!data || data.length === 0) {
      return fallbackWorkshopNotices;
    }

    return (data as WorkshopNoticeRow[]).map((notice) => ({
      id: notice.id,
      title: notice.title,
      summary: notice.summary || "",
      date: notice.date_label || "",
      venue: notice.venue || "",
      poster: notice.poster_url || "",
      href: notice.href || "",
      badge: notice.badge || "WORKSHOP",
    }));
  } catch (error) {
    console.error("Workshop notice load failed:", error);
    return fallbackWorkshopNotices;
  }
}