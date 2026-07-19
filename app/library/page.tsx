import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function LibraryPage() {
  return (
    <LexPaperSubPage
      kicker="Library"
      title="Notes, guides, templates, and learning materials."
      body="A library for LexData tutorials, research notes, corpus methods, NLP guides, and platform help."
      cards={[
        {
          title: "Blog",
          body: "Read research notes, workflow ideas, and reflections on language data and AI.",
          href: "/blog",
        },
        {
          title: "Help center",
          body: "Learn how to use courses, workshops, dashboards, and homepage controls.",
          href: "/help",
        },
        {
          title: "Resources",
          body: "Templates and materials for corpus, translation, NLP, and academic writing tasks.",
          href: "/resources",
        },
      ]}
    />
  );
}