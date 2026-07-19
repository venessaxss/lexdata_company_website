import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function ResourcesPage() {
  return (
    <LexPaperSubPage
      kicker="Resources"
      title="Templates for language-data work."
      body="Reusable learning resources for corpus design, annotation, translation evaluation, and NLP projects."
      cards={[
        {
          title: "Corpus project template",
          body: "Plan metadata, sampling, cleaning, segmentation, annotation, and evaluation.",
        },
        {
          title: "NLP workflow checklist",
          body: "A practical checklist for moving from raw text to interpretable results.",
        },
      ]}
    />
  );
}