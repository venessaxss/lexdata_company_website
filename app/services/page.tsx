import Link from "next/link";
import { services } from "@/lib/site";

export default function ServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="badge inline-block">Services</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Research support from corpus to publication.</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        LexData helps researchers and institutions design, collect, process, analyze, visualize, and report data for language, education, translation, ELT, and social science projects.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <div key={service.title} className="card p-6">
            <h2 className="text-2xl font-bold">{service.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {service.items.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="card mt-10 bg-indigo-950 p-8 text-white">
        <h2 className="text-2xl font-bold">Need a customized institutional training or data project?</h2>
        <p className="mt-3 max-w-2xl text-indigo-100">Use the contact page to describe your research field, dataset type, expected output, and timeline.</p>
        <Link href="/contact" className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-950">Contact LexData</Link>
      </div>
    </section>
  );
}
