import Link from "next/link";

type LexPaperSubPageProps = {
  kicker: string;
  title: string;
  body: string;
  cards: {
    title: string;
    body: string;
    href?: string;
  }[];
};

export default function LexPaperSubPage({
  kicker,
  title,
  body,
  cards,
}: LexPaperSubPageProps) {
  return (
    <main className="lex-subpage">
      <section className="lex-subpage-hero">
        <p>{kicker}</p>
        <h1>{title}</h1>
        <span>{body}</span>
      </section>

      <section className="lex-subpage-grid">
        {cards.map((card) => (
          <Link key={card.title} href={card.href || "#"} className="lex-subpage-card">
            <small>LexData</small>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <b>Open -&gt;</b>
          </Link>
        ))}
      </section>
    </main>
  );
}