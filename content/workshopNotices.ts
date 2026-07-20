export type WorkshopNotice = {
  id: string;
  title: string;
  summary: string;
  date: string;
  venue: string;
  poster?: string;
  href?: string;
  badge?: string;
};

export const workshopNotices: WorkshopNotice[] = [
  {
    id: "workshop-01",
    title: "Upcoming LexData workshop",
    summary: "Add the workshop title, schedule, venue, registration link, and poster here.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "NEW WORKSHOP",
  },
  {
    id: "workshop-02",
    title: "Research methods training",
    summary: "Use this card for a new training session, seminar, or academic workshop notice.",
    date: "Coming soon",
    venue: "Online or on site",
    poster: "",
    href: "",
    badge: "NOTICE",
  },
  {
    id: "workshop-03",
    title: "Language and AI workshop",
    summary: "Upload a poster to public/workshop-posters and add its path in this file.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "UPCOMING",
  },
];