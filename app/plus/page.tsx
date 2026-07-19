import LexPaperSubPage from "@/components/LexPaperSubPage";

export default function PlusPage() {
  return (
    <LexPaperSubPage
      kicker="Plus+"
      title="Advanced support for serious language-data projects."
      body="Premium workshops, tailored research support, private learning spaces, and project-based consultation."
      cards={[
        {
          title: "Private workshop",
          body: "Request a tailored training session for your institution, team, or research group.",
          href: "/contact",
        },
        {
          title: "Project consultation",
          body: "Get support for corpus design, NLP pipeline planning, and translation technology evaluation.",
          href: "/contact",
        },
      ]}
    />
  );
}