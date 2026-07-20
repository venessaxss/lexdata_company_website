import type { Metadata } from "next";
import LexPaperNavbar from "@/components/LexPaperNavbar";
import AuthSync from "@/components/AuthSync";
import VisitTracker from "@/components/VisitTracker";
import AutoTranslator from "@/components/AutoTranslator";
import { PaperMotion } from "@/components/site/PaperMotion";
import { site } from "@/lib/site";
import { getServerI18n } from "@/lib/language-server";
import "./globals.css";
import "./lexdata-theme.css";

export const metadata: Metadata = {
  title: `${site.name} | Data-driven Research Training Platform`,
  description: site.tagline,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language, direction } = await getServerI18n();

  return (
    <html lang={language} dir={direction}>
      <body className="lex-paper-site">
        <PaperMotion />
<VisitTracker />
        <AutoTranslator language={language} />
        <LexPaperNavbar />
        {children}
        <AuthSync />
      </body>
    </html>
  );
}