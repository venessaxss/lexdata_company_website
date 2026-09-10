import type { Metadata } from "next";
import EllipsusNav from "@/components/EllipsusNav";
import AuthSync from "@/components/AuthSync";
import VisitTracker from "@/components/VisitTracker";
import AutoTranslator from "@/components/AutoTranslator";
import { PaperMotion } from "@/components/site/PaperMotion";
import { site } from "@/lib/site";
import { getServerI18n } from "@/lib/language-server";
import { getCurrentProfile, normalizeRole } from "@/lib/auth";
import "./globals.css";
import "./lexdata-theme.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${site.name} | Data-driven Research Training Platform`,
  description: site.tagline,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language, direction } = await getServerI18n();
  const profile = await getCurrentProfile();
  const role = normalizeRole(profile?.role);
  const isLoggedIn = Boolean(profile);
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "manager"
        ? "/manager"
        : role === "speaker"
          ? "/speaker"
          : "/dashboard";

  return (
    <html lang={language} dir={direction}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2957074785168074"
          crossOrigin="anonymous"
        />
      </head>
      <body className="lex-paper-site">
        <PaperMotion />
        <VisitTracker />
        <AutoTranslator language={language} />
        <EllipsusNav isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
        {children}
        <AuthSync />
      </body>
    </html>
  );
}
