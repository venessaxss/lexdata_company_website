import { aims, mission, site, whyLexData } from "@/lib/site";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="badge inline-block">More about us</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">About {site.name}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        {site.name} is a research-driven data solutions company focused on language sciences, translation, education, ELT, and social sciences. We specialize in the collection, processing, analysis, and interpretation of large datasets using Python, R, NLP, and data science workflows.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-2xl font-bold">Our mission</h2>
          <p className="mt-4 leading-7 text-slate-700">{mission.en}</p>
          <p className="mt-4 leading-7 text-slate-700">{mission.zh}</p>
          <p dir="rtl" className="mt-4 leading-8 text-slate-700">{mission.ar}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-2xl font-bold">Why LexData?</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {whyLexData.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="section-title">Our aims</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {aims.map((aim) => (
            <div key={aim.title} className="card p-6">
              <h3 className="font-semibold">{aim.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{aim.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
