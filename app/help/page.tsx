import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function HelpPage() {
  return (
    <LexPaperSubPage
      kicker="Help center"
      title="Guides for using LexData."
      body="Find help for courses, workshops, videos, dashboard access, certificates, and admin editing."
      cards={[
        {
          title: "Edit homepage content",
          body: "Use the admin homepage editor to update hero text, typing messages, video slots, and cases.",
          href: "/admin/homepage-content",
        },
        {
          title: "Manage videos",
          body: "Use the manager video page to add workshop previews and homepage videos.",
          href: "/manager/homepage-videos",
        },
      ]}
    />
  );
}