import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | LexData",
  description:
    "How LexData collects, uses, shares, and protects personal information, including disclosures about cookies and Google advertising services.",
};

const updatedDate = "September 8, 2026";

const sectionClass =
  "scroll-mt-28 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8";
const headingClass =
  "font-serif text-2xl font-black tracking-tight text-slate-950 md:text-3xl";
const paragraphClass = "mt-4 leading-7 text-slate-700";
const listClass = "mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-700";
const linkClass = "font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900";

const sections = [
  ["scope", "1. Scope and who we are"],
  ["information", "2. Information we collect"],
  ["uses", "3. How we use information"],
  ["legal-bases", "4. Legal bases"],
  ["cookies", "5. Cookies and local storage"],
  ["advertising", "6. Google AdSense and advertising"],
  ["choices", "7. Consent and advertising choices"],
  ["sharing", "8. How we share information"],
  ["retention", "9. Retention and international transfers"],
  ["rights", "10. Your privacy rights"],
  ["security", "11. Security"],
  ["children", "12. Children’s privacy"],
  ["changes", "13. Changes and contact"],
] as const;

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="lx-page min-h-screen bg-[#f8f5ee]" style={{ paddingTop: "var(--lx-nav-h)" }}>
      

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
            LexData legal
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-black tracking-tight md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            This policy explains how LexData handles personal information when you use our
            website, learning platform, workshops, communications, and related services. It
            also explains how Google and other advertising providers may use data if
            advertising is enabled.
          </p>
          <p className="mt-6 text-sm font-semibold text-slate-400">
            Effective and last updated: {updatedDate}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              On this page
            </h2>
            <nav className="mt-4" aria-label="Privacy policy sections">
              <ol className="space-y-2 text-sm">
                {sections.map(([id, label]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="block rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="space-y-6">
            <section id="scope" className={sectionClass}>
              <h2 className={headingClass}>1. Scope and who we are</h2>
              <p className={paragraphClass}>
                {site.legalName} ("LexData," "we," "us," or "our") operates this website
                and is responsible for the personal information described in this policy.
                This policy applies to visitors, registered members, course participants,
                workshop attendees, speakers, staff, managers, and administrators.
              </p>
              <p className={paragraphClass}>
                This policy does not govern websites or services operated independently by
                third parties. Their own privacy policies apply when you follow an external
                link or use their service.
              </p>
            </section>

            <section id="information" className={sectionClass}>
              <h2 className={headingClass}>2. Information we collect</h2>
              <p className={paragraphClass}>Depending on how you use LexData, we may collect:</p>
              <ul className={listClass}>
                <li>
                  <strong>Account data:</strong> name, email address, authentication records,
                  account status, and assigned role.
                </li>
                <li>
                  <strong>Profile data:</strong> certificate name, institution, department,
                  affiliation, profession, degree, country, city, phone number, research
                  interests, and biography when you choose or are required to provide them.
                </li>
                <li>
                  <strong>Learning and event data:</strong> enrollments, course progress,
                  workshop registrations, attendance, livestream participation, chat or help
                  messages, certificate applications, certificates, and receipt records.
                </li>
                <li>
                  <strong>Transaction data:</strong> product, amount, currency, payment status,
                  and payment-session or receipt references. Payment card details are entered
                  directly with Stripe; LexData does not receive or store your complete card
                  number or security code.
                </li>
                <li>
                  <strong>Technical and usage data:</strong> a first-party visitor identifier,
                  pages viewed, page title, referring page, browser user agent, date and time,
                  and technical log data such as IP address and device or network information.
                </li>
                <li>
                  <strong>Advertising data:</strong> if advertising is enabled, Google and its
                  partners may receive the page URL, IP address, cookie or device identifiers,
                  general location, and information about ad impressions, interactions, and
                  consent choices.
                </li>
              </ul>
            </section>

            <section id="uses" className={sectionClass}>
              <h2 className={headingClass}>3. How we use information</h2>
              <ul className={listClass}>
                <li>Authenticate accounts and maintain secure sessions.</li>
                <li>Operate courses, workshops, livestreams, registrations, and dashboards.</li>
                <li>Track progress and attendance and issue certificates and receipts.</li>
                <li>Process payments, refunds, disputes, and financial records.</li>
                <li>Send service messages, notices, support responses, and requested updates.</li>
                <li>Measure site usage, diagnose problems, prevent fraud, and improve services.</li>
                <li>Display and measure advertising where enabled and permitted.</li>
                <li>Comply with law, enforce our terms, and protect users and LexData.</li>
              </ul>
            </section>

            <section id="legal-bases" className={sectionClass}>
              <h2 className={headingClass}>4. Legal bases</h2>
              <p className={paragraphClass}>
                Where applicable law requires a legal basis, we process personal information
                as necessary to perform a contract with you, comply with legal obligations,
                pursue legitimate interests such as security and service improvement, or act
                with your consent. You may withdraw consent at any time, but withdrawal does
                not affect processing that was lawful before it was withdrawn.
              </p>
            </section>

            <section id="cookies" className={sectionClass}>
              <h2 className={headingClass}>5. Cookies and local storage</h2>
              <p className={paragraphClass}>
                Cookies are small files stored by your browser. We also use local storage,
                which keeps information in your browser until it is removed. LexData currently
                uses the following first-party technologies:
              </p>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Technology</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Typical duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 font-semibold">LexData session and Supabase authentication</td>
                      <td className="px-4 py-3">Sign-in, security, and account access</td>
                      <td className="px-4 py-3">Session-dependent; LexData’s durable session lasts up to 30 days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">lexdata_language</td>
                      <td className="px-4 py-3">Remembers your language preference</td>
                      <td className="px-4 py-3">Up to 12 months</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">lexdata_visitor_id (local storage)</td>
                      <td className="px-4 py-3">Recognizes repeat visits for first-party site measurement</td>
                      <td className="px-4 py-3">Until browser storage is cleared</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">Advertising cookies and identifiers</td>
                      <td className="px-4 py-3">Ad delivery, measurement, personalization, frequency limits, and fraud prevention</td>
                      <td className="px-4 py-3">Set by Google or the relevant advertising provider</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className={paragraphClass}>
                You can delete or block cookies and local storage through your browser. Doing
                so may sign you out or prevent preferences and parts of the platform from
                working correctly.
              </p>
            </section>

            <section id="advertising" className={sectionClass}>
              <h2 className={headingClass}>6. Google AdSense and advertising</h2>
              <p className={paragraphClass}>
                LexData may display advertisements provided by Google AdSense. Third-party
                vendors, including Google, use cookies to serve ads based on a user’s prior
                visits to LexData or other websites. Google’s use of advertising cookies
                enables Google and its partners to serve ads based on visits to this website
                and other websites on the Internet.
              </p>
              <p className={paragraphClass}>
                When a page uses Google advertising services, a browser may automatically send
                Google information such as the page URL and IP address. Google and advertising
                partners may also place or read cookies, use web beacons, or use similar
                technologies to deliver ads, measure performance, limit repeated ads, prevent
                fraud and abuse, and—when permitted—personalize advertising.
              </p>
              <p className={paragraphClass}>
                Learn more about{" "}
                <ExternalLink href="https://policies.google.com/technologies/partner-sites">
                  how Google uses information from sites that use its services
                </ExternalLink>
                , review the{" "}
                <ExternalLink href="https://policies.google.com/privacy">
                  Google Privacy Policy
                </ExternalLink>
                , and see Google’s{" "}
                <ExternalLink href="https://support.google.com/adsense/answer/1348695?hl=en">
                  advertising-cookie disclosure
                </ExternalLink>
                .
              </p>
              <p className={paragraphClass}>
                If LexData authorizes additional third-party advertising vendors or ad
                networks, this policy or an accompanying consent interface will identify them
                and provide available privacy controls.
              </p>
            </section>

            <section id="choices" className={sectionClass}>
              <h2 className={headingClass}>7. Consent and advertising choices</h2>
              <ul className={listClass}>
                <li>
                  You can control personalized advertising through{" "}
                  <ExternalLink href="https://myadcenter.google.com/">
                    Google My Ad Center
                  </ExternalLink>
                  .
                </li>
                <li>
                  You can opt out of some participating third-party vendors’ personalized
                  advertising through{" "}
                  <ExternalLink href="https://optout.aboutads.info/">
                    YourAdChoices
                  </ExternalLink>
                  .
                </li>
                <li>
                  Where required, visitors in the European Economic Area, United Kingdom, and
                  Switzerland will be asked for consent through a Google-certified consent
                  management platform before Google advertising cookies or personal-data use
                  for ad personalization. The interface will allow consent choices to be
                  reviewed or withdrawn.
                </li>
                <li>
                  Non-personalized ads are based primarily on context rather than a user’s past
                  behavior, but Google may still use cookies or similar technologies for ad
                  delivery, aggregated reporting, frequency limits, and fraud prevention.
                </li>
                <li>
                  Where applicable under U.S. state law, you may opt out of targeted advertising
                  or the sale or sharing of personal information. LexData does not sell personal
                  information for money. If an advertising arrangement is legally considered a
                  sale or sharing, the required opt-out control will be provided when that
                  advertising is enabled.
                </li>
              </ul>
            </section>

            <section id="sharing" className={sectionClass}>
              <h2 className={headingClass}>8. How we share information</h2>
              <p className={paragraphClass}>
                We do not disclose personal information except as described here or with your
                direction. We may share information with:
              </p>
              <ul className={listClass}>
                <li><strong>Supabase</strong> for authentication, databases, and file storage.</li>
                <li><strong>Vercel</strong> for website hosting, delivery, security, and technical logs.</li>
                <li><strong>Stripe</strong> for payment processing, fraud prevention, refunds, and payment records.</li>
                <li><strong>Resend and email providers</strong> for transactional and service communications.</li>
                <li><strong>Google and advertising partners</strong> for advertising and measurement when enabled.</li>
                <li>Professional advisers, regulators, courts, or authorities when reasonably necessary or legally required.</li>
                <li>A successor organization in connection with a merger, reorganization, financing, or transfer of the service, subject to appropriate safeguards.</li>
              </ul>
              <p className={paragraphClass}>
                These providers process information under their own terms and privacy notices
                and, where applicable, under agreements with LexData.
              </p>
            </section>

            <section id="retention" className={sectionClass}>
              <h2 className={headingClass}>9. Retention and international transfers</h2>
              <p className={paragraphClass}>
                We retain information for as long as reasonably necessary to provide the
                service, maintain account and learning records, issue and verify certificates
                or receipts, resolve disputes, enforce agreements, and meet legal, tax,
                accounting, security, and fraud-prevention obligations. Retention periods vary
                by record type. We delete or anonymize information when it is no longer needed,
                unless continued retention is required or permitted by law.
              </p>
              <p className={paragraphClass}>
                LexData and its providers may process information in countries other than the
                country where you live. Where required, we use recognized safeguards for
                international transfers, such as contractual protections or adequacy mechanisms.
              </p>
            </section>

            <section id="rights" className={sectionClass}>
              <h2 className={headingClass}>10. Your privacy rights</h2>
              <p className={paragraphClass}>
                Depending on your location, you may have rights to request access, correction,
                deletion, restriction, portability, or objection; to withdraw consent; and to
                appeal a decision about a privacy request. You may update many profile details
                from your dashboard. To make another request, email{" "}
                <a className={linkClass} href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                . We may need to verify your identity before acting on a request.
              </p>
              <p className={paragraphClass}>
                You may also complain to the data-protection or privacy authority where you
                live. Rights are subject to applicable exceptions, including requirements to
                preserve transaction, tax, security, or legal records.
              </p>
            </section>

            <section id="security" className={sectionClass}>
              <h2 className={headingClass}>11. Security</h2>
              <p className={paragraphClass}>
                We use reasonable administrative, technical, and organizational safeguards
                designed to protect personal information. These include controlled access,
                authenticated sessions, transport encryption, and provider security controls.
                No Internet transmission or storage system is completely secure, so we cannot
                guarantee absolute security.
              </p>
            </section>

            <section id="children" className={sectionClass}>
              <h2 className={headingClass}>12. Children’s privacy</h2>
              <p className={paragraphClass}>
                LexData is not directed to children under 13 or the higher minimum age required
                by local law, and we do not knowingly collect their personal information
                without appropriate authorization. We do not knowingly use personal information
                from children for personalized advertising. Contact us if you believe a child
                has provided personal information improperly so we can investigate and take
                appropriate action.
              </p>
            </section>

            <section id="changes" className={sectionClass}>
              <h2 className={headingClass}>13. Changes and contact</h2>
              <p className={paragraphClass}>
                We may update this policy when our services, providers, advertising practices,
                or legal obligations change. We will post the revised version here and change
                the effective date. If a change materially affects your rights, we will provide
                additional notice where required.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-slate-700">
                <p className="font-black text-slate-950">Privacy contact</p>
                <p className="mt-2">{site.legalName}</p>
                <p className="mt-1">
                  Email:{" "}
                  <a className={linkClass} href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                </p>
                <p className="mt-2 text-sm">
                  You may also use the{" "}
                  <Link href="/contact" className={linkClass}>
                    LexData contact page
                  </Link>
                  .
                </p>
              </div>
            </section>

            <p className="px-2 text-xs leading-5 text-slate-500">
              This policy is intended to provide transparent information about LexData’s data
              practices. It is not a substitute for rights or protections that apply under
              mandatory law.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
