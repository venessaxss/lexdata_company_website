import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function AiStancePage() {
  return (
    <LexPaperSubPage
      kicker="Our stance on AI"
      title="Human-centered AI for language research."
      body="LexData uses AI as a research assistant, not a replacement for human expertise, interpretation, and accountability."
      cards={[
        {
          title: "Human judgment first",
          body: "AI can support workflow speed, but interpretation and evaluation remain human responsibilities.",
        },
        {
          title: "Transparent methods",
          body: "We value clear documentation, reproducible steps, and explainable research decisions.",
        },
        {
          title: "Data responsibility",
          body: "Language data should be handled with care, consent, context, and scholarly ethics.",
        },
      ]}
    />
  );
}