import EllipsusNav from "@/components/EllipsusNav";

export const metadata = {
  title: "Privacy Policy | LexData",
  description: "Privacy Policy for LexData - Intelligent Data Solutions for Language, Translation, Education & Society.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="lx-page" style={{ paddingTop: "var(--lx-nav-h)" }}>
        <EllipsusNav />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "48px", marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#666", marginBottom: "40px" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2>1. Introduction</h2>
          <p>
            LexData ("we," "us," or "our") operates this website. This Privacy
            Policy explains how we collect, use, and protect your information
            when you visit or use our platform, including our courses,
            workshops, and related services.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>Account information (name, email address) when you sign up or log in</li>
            <li>Profile information you provide (such as printed name for certificates)</li>
            <li>Course enrollment and progress data</li>
            <li>Payment and receipt information processed through our payment provider</li>
            <li>Usage data such as pages visited and interactions with the site</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain our courses, workshops, and dashboard features</li>
            <li>Process enrollments, certificates, and payment receipts</li>
            <li>Communicate updates, notices, and announcements</li>
            <li>Improve our website and services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>4. Cookies and Advertising</h2>
          <p>
            Our website may use cookies to improve user experience. We may
            also work with third-party advertising partners, such as Google
            AdSense, which may use cookies to serve ads based on your prior
            visits to this or other websites. You can manage cookie
            preferences through your browser settings. Third-party vendors,
            including Google, may use cookies to serve ads based on a user's
            prior visits to this website or other websites.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>5. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard practices
            through our database provider. We implement reasonable technical
            and organizational measures to protect your information from
            unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>6. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We may share
            information with trusted third-party service providers (such as
            payment processors or hosting services) only as necessary to
            operate our platform, or when required by law.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>7. Your Rights</h2>
          <p>
            You may access, update, or request deletion of your personal
            information by contacting us. You may also opt out of
            non-essential communications at any time.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not directed to children under the age of 13,
            and we do not knowingly collect personal information from
            children.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will
            be posted on this page with an updated revision date.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please
            contact us through our{" "}
            <a href="/contact" style={{ color: "var(--lx-blue, #1f78c8)" }}>
              Contact page
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}