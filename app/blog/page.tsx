import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function BlogPage() {
  return (
    <LexPaperSubPage
      kicker="Blog"
      title="Research notes from the LexData studio."
      body="Short essays, updates, and tutorials on corpus linguistics, NLP, AI research, and translation technology."
      cards={[
        {
          title: "How to start a corpus project",
          body: "A practical outline for collecting, cleaning, documenting, and analyzing text data.",
        },
        {
          title: "NLP for humanists",
          body: "What language researchers need to know before using text mining and embeddings.",
        },
      ]}
    />
  );
}