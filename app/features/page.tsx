import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function FeaturesPage() {
  return (
    <LexPaperSubPage
      kicker="Features"
      title="Language-data tools for research, teaching, and translation."
      body="Explore LexData workflows for corpus building, NLP, annotation, AI-assisted research, and training."
      cards={[
        {
          title: "AI research workflows",
          body: "Use AI carefully for literature review, coding support, annotation planning, and research writing.",
          href: "/features",
        },
        {
          title: "NLP studio",
          body: "Move from raw text to cleaned corpora, keywords, embeddings, topics, and evaluation.",
          href: "/features",
        },
        {
          title: "Course platform",
          body: "Connect courses, workshops, videos, and dashboards into one learning environment.",
          href: "/courses",
        },
      ]}
    />
  );
}