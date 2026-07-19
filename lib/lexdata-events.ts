import { createAdminClient } from "@/lib/supabase/admin";

export type LexDataEvent = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  event_date: string;
  poster_url: string;
  image_url: string;
  video_url: string;
  cta_label: string;
  cta_href: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export const fallbackLexDataEvents: LexDataEvent[] = [
  {
    id: "fallback-1",
    slug: "ai-research-workflow-bootcamp",
    title: "AI Research Workflow Bootcamp is open",
    excerpt:
      "A practical workshop for literature review, corpus planning, annotation, coding support, and responsible academic writing with AI.",
    content:
      "LexData is launching a hands-on AI research workflow bootcamp for students, researchers, and educators. The workshop focuses on practical research tasks: reading papers, building a literature map, designing corpus workflows, planning annotation, and using AI without losing scholarly judgment.",
    category: "Workshop",
    author: "LexData Team",
    event_date: new Date().toISOString().slice(0, 10),
    poster_url: "",
    image_url: "",
    video_url: "",
    cta_label: "View workshop",
    cta_href: "/workshops",
    is_active: true,
    is_featured: true,
    sort_order: 1,
  },
];

export function slugifyEventTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function formatEventMonth(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatEventDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    return url;
  } catch {
    return "";
  }
}

export async function getLexDataEvents(options?: {
  limit?: number;
  featuredOnly?: boolean;
  activeOnly?: boolean;
}) {
  try {
    const admin = createAdminClient();

    let query = admin
      .from("lexdata_events")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("event_date", { ascending: false });

    if (options?.activeOnly !== false) {
      query = query.eq("is_active", true);
    }

    if (options?.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("lexdata_events error:", error.message);
      return fallbackLexDataEvents;
    }

    return (data ?? []) as LexDataEvent[];
  } catch (error) {
    console.error("getLexDataEvents error:", error);
    return fallbackLexDataEvents;
  }
}

export async function getLexDataEventBySlug(slug: string) {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("lexdata_events")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("lexdata event by slug error:", error.message);
      return fallbackLexDataEvents.find((item) => item.slug === slug) ?? null;
    }

    return data as LexDataEvent | null;
  } catch (error) {
    console.error("getLexDataEventBySlug error:", error);
    return fallbackLexDataEvents.find((item) => item.slug === slug) ?? null;
  }
}