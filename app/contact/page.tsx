import Image from "next/image";
import Link from "next/link";
import { Mail, Building2, Target, CheckCircle2 } from "lucide-react";
import { site } from "@/lib/site";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
        Connect with LexData
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        Contact us for workshops, customized institutional training, corpus
        development, research consulting, and long-term business partnership
        plans.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <h2 className="text-2xl font-bold">Contact details</h2>

          <div className="mt-6 space-y-5 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-slate-100 p-2">
                <Mail className="h-4 w-4 text-slate-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <a href={"mailto:" + site.email} className="text-slate-600 hover:text-slate-900 hover:underline">
                  {site.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-slate-100 p-2">
                <Building2 className="h-4 w-4 text-slate-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Organization</p>
                <p className="text-slate-600">{site.legalName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-slate-100 p-2">
                <Target className="h-4 w-4 text-slate-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Focus</p>
                <p className="text-slate-600">
                  Language, translation, education, ELT, and social science
                  data solutions
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/courses" className="btn-primary">
              View courses
            </Link>
            <Link href="/services" className="btn-light">
              View services
            </Link>
          </div>
        </div>

        <div className="card flex flex-col items-center p-6 text-center">
          <span className="rounded-lg bg-slate-100 p-2">
            <InstagramIcon className="h-4 w-4 text-slate-700" />
          </span>
          <h2 className="mt-3 text-lg font-bold">Follow us</h2>
          <p className="mt-1 text-sm text-slate-600">
            Scan to follow @lexdata.techhub
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <Image
              src="/instagram-qr.png.jpeg"
              alt="LexData Instagram QR code"
              width={220}
              height={220}
              className="h-auto w-full"
            />
          </div>

          <a href="https://instagram.com/lexdata.techhub" target="_blank" rel="noopener noreferrer" className="btn-light mt-5 w-full">
            @lexdata.techhub
          </a>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-2xl font-bold">What to send us</h2>
        <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          {[
            "Your institution or research field",
            "Course/workshop topic you need",
            "Dataset type: text, speech, survey, corpus, or mixed data",
            "Expected output: course, report, corpus, dashboard, or publication support",
            "Your preferred timeline and delivery mode",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}