import Link from "next/link";
import TeamShowcase from "@/components/TeamShowcase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const values = [
  {
    title: "For language people, by language people",
    body:
      "LexData is built for researchers, translators, educators, students, and teams who work seriously with language.",
  },
  {
    title: "Human judgment stays central",
    body:
      "AI can support the workflow, but interpretation, ethics, evaluation, and meaning remain human responsibilities.",
  },
  {
    title: "Language data should be transparent",
    body:
      "We care about clean corpora, documented methods, responsible annotation, and research that others can understand.",
  },
  {
    title: "Learning should lead to real work",
    body:
      "Our courses and workshops are designed around real academic, institutional, and professional language-data tasks.",
  },
];

export default function AboutPage() {
  return (
    <main className="lex-about-page">
      <section className="lex-about-hero">
        <div className="lex-about-float-words" aria-hidden="true">
          <span>corpus</span>
          <span>NLP</span>
          <span>translation</span>
          <span>AI</span>
          <span>research</span>
        </div>

        <p className="paper-rev">About us</p>

        <h1 className="paper-rev">
          We believe language data can change how people research, teach, and
          understand the world.
        </h1>

        <div className="lex-about-intro paper-rev">
          <p>
            LexData is an intelligent data solutions studio focused on language,
            translation, education, AI, NLP, and corpus-based research.
          </p>

          <p>
            We bring together humanities thinking and computational methods so
            language people can build better corpora, evaluate models, design
            research workflows, and learn practical AI skills.
          </p>
        </div>

        <div className="lex-about-jump paper-rev">
          <a href="#values">Our values</a>
          <a href="#team">Meet the team</a>
        </div>
      </section>

      <section className="lex-about-values paper-page" id="values">
        <div className="paper-wrap">
          <div className="lex-about-section-head paper-rev">
            <p>Our values</p>
            <h2>Careful language work. Responsible AI. Human expertise.</h2>
          </div>

          <div className="lex-about-values-grid">
            {values.map((value, index) => (
              <article
                key={value.title}
                className="lex-about-value-card paper-rev paper-turn"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lex-about-team paper-page" id="team">
        <div className="paper-wrap">
          <div className="lex-about-section-head paper-rev">
            <p>Meet the team</p>
            <h2>The people behind LexData.</h2>
          </div>

          <div className="lex-about-team-shell paper-rev paper-turn">
            <TeamShowcase />
          </div>

          <div className="lex-about-team-actions paper-rev">
            <Link href="/manager/team">Manage team</Link>
            <Link href="/contact">Work with us</Link>
          </div>
        </div>
      </section>

      <section className="lex-about-cta paper-page">
        <h2 className="paper-rev">Build better language-data work with us.</h2>

        <div className="paper-rev">
          <Link href="/courses">Browse courses</Link>
          <Link href="/workshops">Upcoming workshops</Link>
        </div>
      </section>
    </main>
  );
}