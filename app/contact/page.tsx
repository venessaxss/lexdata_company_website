import Link from "next/link";
import { site } from "@/lib/site";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="badge inline-block">Contact</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Connect with LexData</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        Contact us for workshops, customized institutional training, corpus development, research consulting, and long-term business partnership plans.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-2xl font-bold">Contact details</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-700">
            <p><span className="font-semibold">Email:</span> {site.email}</p>
            <p><span className="font-semibold">Organization:</span> {site.legalName}</p>
            <p><span className="font-semibold">Focus:</span> Language, translation, education, ELT, and social science data solutions</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses" className="btn-primary">View courses</Link>
            <Link href="/services" className="btn-light">View services</Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold">What to send us</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li>• Your institution or research field</li>
            <li>• Course/workshop topic you need</li>
            <li>• Dataset type: text, speech, survey, corpus, or mixed data</li>
            <li>• Expected output: course, report, corpus, dashboard, or publication support</li>
            <li>• Your preferred timeline and delivery mode</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
