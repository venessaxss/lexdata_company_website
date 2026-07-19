import { createAdminClient } from "@/lib/supabase/admin";

export type HomepageContentSlot = {
  key: string;
  label: string;
  title: string;
  body: string;
  href: string;
  is_active: boolean;
  sort_order: number;
};

export const homepageContentDefaults: HomepageContentSlot[] = [
  {
    key: "hero_title",
    label: "Hero title",
    title: "Write like a human.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 1,
  },
  {
    key: "hero_subtitle",
    label: "Hero subtitle",
    title:
      "LexData is a language-data studio made for humanists, researchers, translators, and language people.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 2,
  },
  {
    key: "hero_primary_button",
    label: "Primary button",
    title: "Join for free",
    body: "",
    href: "/signup",
    is_active: true,
    sort_order: 3,
  },
  {
    key: "hero_secondary_button",
    label: "Secondary button",
    title: "Browse courses",
    body: "",
    href: "/courses",
    is_active: true,
    sort_order: 4,
  },
  {
    key: "hero_typing_01",
    label: "Hero typing message 01",
    title: "AI-powered language research for humanists.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 5,
  },
  {
    key: "hero_typing_02",
    label: "Hero typing message 02",
    title: "Corpus linguistics, NLP, and data science in one platform.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 6,
  },
  {
    key: "hero_typing_03",
    label: "Hero typing message 03",
    title: "Build corpora, annotate texts, evaluate models, and publish insights.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 7,
  },
  {
    key: "hero_typing_04",
    label: "Hero typing message 04",
    title: "Human-centered AI for translation, education, and research.",
    body: "",
    href: "",
    is_active: true,
    sort_order: 8,
  },
  {
    key: "dashboard_slot_01",
    label: "Dashboard slot 01",
    title: "Add chart or activity feed",
    body:
      "Use this slot for enrollment trends, registration summaries, payment status, or workshop analytics.",
    href: "",
    is_active: true,
    sort_order: 10,
  },
  {
    key: "dashboard_slot_02",
    label: "Dashboard slot 02",
    title: "Add manager snapshot",
    body:
      "Use this slot for admin-managed reports, recent users, media uploads, or platform activity.",
    href: "",
    is_active: true,
    sort_order: 11,
  },
  {
    key: "message_slot_01",
    label: "Message slot 01",
    title: "Add homepage message here",
    body:
      "Use this slot later for a founder message, student note, workshop announcement, or platform update.",
    href: "",
    is_active: true,
    sort_order: 20,
  },
  {
    key: "message_slot_02",
    label: "Message slot 02",
    title: "Add announcement here",
    body:
      "Use this slot for deadlines, course openings, registration notices, summer schools, or research events.",
    href: "",
    is_active: true,
    sort_order: 21,
  },
  {
    key: "message_slot_03",
    label: "Message slot 03",
    title: "Add research note here",
    body:
      "Use this slot for corpus, NLP, translation, AI, or academic writing updates.",
    href: "",
    is_active: true,
    sort_order: 22,
  },
  {
    key: "video_slot_01",
    label: "Video slot 01",
    title: "Add featured video here",
    body:
      "Use this slot for a hero video, workshop preview, trainer message, or embedded media.",
    href: "/manager/homepage-videos",
    is_active: true,
    sort_order: 30,
  },
  {
    key: "video_slot_02",
    label: "Video slot 02",
    title: "Add workshop highlight here",
    body:
      "Use this slot for a selected workshop recording, short preview, or promotional clip.",
    href: "/manager/homepage-videos",
    is_active: true,
    sort_order: 31,
  },
];

export async function getHomepageContentSlots() {
  const fallbackMap = new Map(
    homepageContentDefaults.map((item) => [item.key, item])
  );

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("homepage_content_slots")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("homepage_content_slots error:", error.message);
      return Object.fromEntries(fallbackMap);
    }

    for (const item of data ?? []) {
      fallbackMap.set(item.key, {
        key: item.key,
        label: item.label ?? "",
        title: item.title ?? "",
        body: item.body ?? "",
        href: item.href ?? "",
        is_active: item.is_active !== false,
        sort_order: item.sort_order ?? 0,
      });
    }

    return Object.fromEntries(fallbackMap);
  } catch (error) {
    console.error("getHomepageContentSlots error:", error);
    return Object.fromEntries(fallbackMap);
  }
}