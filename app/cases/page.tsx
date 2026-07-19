import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function CasesPage() {
  return (
    <LexPaperSubPage
      kicker="Previous cases"
      title="Selected LexData cases and research workflows."
      body="A curated space for past projects, workshops, corpus tasks, NLP demos, and collaboration outcomes."
      cards={[
        {
          title: "AI-assisted literature review",
          body: "A workshop case showing how researchers can use GenAI without losing academic judgment.",
        },
        {
          title: "Corpus annotation workflow",
          body: "A research case for preparing multilingual textual data for discourse and translation analysis.",
        },
        {
          title: "Machine translation evaluation",
          body: "A case for comparing MT output, human revision, error patterns, and quality evidence.",
        },
      ]}
    />
  );
}