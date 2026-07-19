import Link from "next/link";
import {
  Sparkle,
  Squiggle,
  Star,
  Eye,
  SmileBook,
  CaretHat,
  SquigWord,
  ArrowDown,
  Check,
} from "@/components/site/scribbles";

export default function Home() {
  return (
    <main>
      {/* ==================== HERO ==================== */}
      <section className="hero">
        <Sparkle className="float" style={{ "--r": "-8deg", top: 120, left: "6%" } as any} />
        <Squiggle className="float slow coral" style={{ "--r": "10deg", top: 90, right: "8%" } as any} width={70} />
        <Star className="float peri" style={{ "--r": "0deg", bottom: 200, left: "10%" } as any} />

        <div className="wrap">
          <h1 className="rev">
            LexData is a <SquigWord>language-data</SquigWord> studio made for
            humanists.
          </h1>
          <p className="sub rev" style={{ "--d": ".12s" } as any}>
            Courses, corpora, and honest models — bridging the humanities and
            data science for real-world impact.
          </p>
          <div className="cta rev" style={{ "--d": ".24s" } as any}>
            <Link className="btn" href="/courses">
              Join for free
            </Link>
          </div>
          <p className="below rev" style={{ "--d": ".3s" } as any}>
            No credit card. No hype. Just language.
          </p>

          <div className="hero-card-zone">
            <div className="annotation rev" style={{ "--d": ".5s" } as any}>
              <span className="hand">that’s us, annotating!</span>
              <ArrowDown />
            </div>
            <div className="hero-doc paper-card rev" style={{ "--tilt": "-2deg", "--d": ".38s" } as any}>
              <div className="cursors">
                <span className="cursor">Mei ✍️</span>
                <span className="cursor b">Omar ✍️</span>
              </div>
              <div className="doc-title">field_notes_v3 · corpus draft</div>
              <div className="line hl" />
              <div className="line" />
              <div className="line hl2" />
              <div className="line short" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STRIP ==================== */}
      <div className="strip" aria-hidden="true">
        <div className="track">
          {[0, 1].map((i) => (
            <span key={i}>
              ✷ made for language people ✷ corpora with character ✷
              human-annotated, always ✷ built by humanists ✷ honest benchmarks ✷
            </span>
          ))}
        </div>
      </div>

      {/* ==================== INTRODUCTION ==================== */}
      <section className="block center" id="introduction">
        <CaretHat className="float coral" style={{ "--r": "6deg", top: 70, right: "12%" } as any} />
        <div className="wrap">
          <span className="kicker rev">Made for language people</span>
          <h2 className="rev" style={{ "--d": ".08s" } as any}>
            Plenty of tools are made for dashboards and KPIs. That’s not us.
          </h2>
          <p className="lead rev" style={{ "--d": ".16s" } as any}>
            LexData is here to help you build corpora, wrench meaning from
            messy text, raise research standards, and celebrate language in
            all its forms.
          </p>
          <div className="stickers">
            {(
              [
                ["📚", "var(--peri-soft)", "-2deg", "0s", "Language data", "Corpus construction and annotation pipelines with the care of a critical edition."],
                ["🌍", "var(--butter)", "1.5deg", ".1s", "Translation tech", "MT evaluation and terminology systems with humans firmly in the loop."],
                ["🎓", "#f9c9bb", "-1deg", ".2s", "Education", "Courses that take humanists from spreadsheets to working NLP pipelines."],
              ] as const
            ).map(([emoji, bg, tilt, d, title, body]) => (
              <div key={title} className="sticker rev" style={{ "--tilt": tilt, "--d": d } as any}>
                <div className="emoji-badge" style={{ "--bg": bg } as any}>
                  {emoji}
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WORKFLOW ==================== */}
      <section className="block" id="workflow">
        <div className="wrap split">
          <div>
            <span className="kicker rev">One place for the whole arc</span>
            <h2 className="rev" style={{ "--d": ".08s" } as any}>
              One place for corpora, annotation, and insight
            </h2>
            <p className="lead rev" style={{ "--d": ".14s" } as any}>
              Your bespoke Sheets-to-scripts-to-email-to-??? pipeline isn’t
              getting that paper published any faster. (And honestly, it
              sounds stressful.) Streamline how you collect, label, and learn
              from language.
            </p>
            <ul className="checks">
              {[
                ["Stay in control with versioned corpora", ".2s"],
                ["Keep judgments traceable with annotation notes", ".3s"],
                ["Collect, annotate, model, repeat", ".4s"],
              ].map(([text, d]) => (
                <li key={text} className="rev" style={{ "--d": d } as any}>
                  <Check />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="paper-card rev" style={{ "--tilt": "2deg", "--d": ".2s" } as any}>
            <div className="doc-title" style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 8 }}>
              annotation_queue.tsv
            </div>
            <div className="hero-doc" style={{ transform: "none", width: "100%" }}>
              <div className="line hl2" style={{ width: "90%" }} />
              <div className="line" style={{ width: "78%" }} />
              <div className="line hl" style={{ width: "95%" }} />
              <div className="line" style={{ width: "66%" }} />
              <div className="line hl2" style={{ width: "82%" }} />
            </div>
            <p className="hand" style={{ fontSize: 24, marginTop: 14, transform: "rotate(-2deg)" }}>
              ← every label, accounted for
            </p>
          </div>
        </div>
      </section>

      {/* ==================== STANCE BAND ==================== */}
      <section className="band" id="stance">
        <SmileBook className="float" style={{ "--r": "-6deg", top: 50, right: "6%" } as any} />
        <div className="wrap">
          <span className="kicker rev" style={{ color: "var(--ink)" }}>
            A principled alternative
          </span>
          <h2 className="rev" style={{ "--d": ".08s" } as any}>
            By humanists, for humanists.
          </h2>
          <p className="lead rev" style={{ "--d": ".16s" } as any}>
            We think researchers and learners should be free to work with
            language — away from black boxes, inflated claims, and the prying
            eyes of data brokers.
          </p>
          <div className="badges">
            <span className="badge rev" style={{ "--tilt": "-2deg", "--d": ".2s" } as any}>
              Your data is YOURS.
            </span>
            <span className="badge butter rev" style={{ "--tilt": "2deg", "--d": ".3s" } as any}>
              Human-annotated — always.
            </span>
            <span className="badge coral rev" style={{ "--tilt": "-1deg", "--d": ".4s" } as any}>
              Honest benchmarks. No hype.
            </span>
          </div>
        </div>
      </section>

      {/* ==================== CLOSING ==================== */}
      <section className="closing" id="courses-cta">
        <Eye className="float peri" style={{ "--r": "8deg", top: 70, left: "8%" } as any} />
        <Squiggle className="float slow coral" style={{ "--r": "-8deg", bottom: 110, right: "9%" } as any} />
        <div className="wrap">
          <p className="count rev">
            Trusted by <span className="num">1,200 (human)</span> learners, and
            counting…
          </p>
          <h2
            className="rev"
            style={{ "--d": ".1s", fontSize: "clamp(34px,5vw,58px)", maxWidth: "18ch", margin: "0 auto 30px" } as any}
          >
            Get started — write your first query today.
          </h2>
          <div className="rev" style={{ "--d": ".2s" } as any}>
            <Link className="btn coral" href="/courses">
              Sign up — it’s free
            </Link>{" "}
            <Link className="btn ghost" href="/courses">
              Browse courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
