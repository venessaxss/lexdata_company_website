import Link from "next/link";

const nlpFeatures = [
  {
    title: "Multilingual NLP",
    titleAr: "معالجة اللغات الطبيعية متعددة اللغات",
    text: "We help institutions process, classify, search, and analyze multilingual text data for research, education, and business use.",
    textAr:
      "نساعد المؤسسات على معالجة وتصنيف وبحث وتحليل البيانات النصية متعددة اللغات لأغراض البحث والتعليم والأعمال.",
  },
  {
    title: "Corpus & Discourse Analytics",
    titleAr: "تحليل المدونات والخطاب",
    text: "Build searchable corpora, extract linguistic patterns, analyze discourse, and transform raw text into research-ready insights.",
    textAr:
      "نبني مدونات قابلة للبحث، ونستخرج الأنماط اللغوية، ونحلل الخطاب، ونحوّل النصوص الخام إلى رؤى جاهزة للبحث.",
  },
  {
    title: "AI Translation & Annotation",
    titleAr: "الترجمة والوسم بالذكاء الاصطناعي",
    text: "Support high-quality translation workflows, text annotation, sentiment analysis, entity recognition, and domain-specific datasets.",
    textAr:
      "ندعم سير عمل الترجمة عالية الجودة، ووسم النصوص، وتحليل المشاعر، واستخراج الكيانات، وبناء مجموعات بيانات متخصصة.",
  },
];

export default function NlpAttractionSection() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-700">
              NLP • AI • Language Intelligence
            </p>

            <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Turn language data into research, training, and business value.
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              LexData integrates Natural Language Processing, corpus methods,
              AI-assisted analysis, and multilingual data workflows to support
              universities, research teams, companies, and public institutions.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-700"
              >
                Start an NLP Project
              </Link>

              <Link
                href="/workshops"
                className="rounded-2xl border border-slate-300 px-6 py-4 text-sm font-black text-slate-800 hover:bg-slate-50"
              >
                Explore NLP Training
              </Link>
            </div>
          </div>

          <div
            dir="rtl"
            className="rounded-[2rem] border border-blue-100 bg-blue-50 p-8"
          >
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              الذكاء اللغوي
            </p>

            <h3 className="mt-4 text-3xl font-black leading-tight text-slate-950">
              حوّل البيانات اللغوية إلى معرفة قابلة للاستخدام.
            </h3>

            <p className="mt-5 text-base leading-8 text-slate-700">
              تجمع LexData بين معالجة اللغات الطبيعية، وتحليل الخطاب، وبناء
              المدونات، والذكاء الاصطناعي لمساعدة المؤسسات على فهم النصوص
              متعددة اللغات واتخاذ قرارات أفضل.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["تحليل النصوص", "الترجمة الذكية", "الوسم اللغوي", "تحليل المشاعر"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-800 ring-1 ring-blue-100"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {nlpFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-xl font-black text-slate-950">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.text}
              </p>

              <div dir="rtl" className="mt-6 border-t border-slate-200 pt-5">
                <h4 className="text-lg font-black text-blue-800">
                  {feature.titleAr}
                </h4>

                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {feature.textAr}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}