import type { Metadata } from "next";
import LexPaperNavbar from "@/components/LexPaperNavbar";
import VisitTracker from "@/components/VisitTracker";
import AutoTranslator from "@/components/AutoTranslator";
import PaperRevealShell from "@/components/PaperRevealShell";
import { site } from "@/lib/site";
import { getServerI18n } from "@/lib/language-server";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Work+Sans:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="lex-paper-site">
        <VisitTracker />
        <AutoTranslator language={language} />

        <PaperRevealShell>
          <LexPaperNavbar />
          {children}
        </PaperRevealShell>
      </body>
    </html>
  );
}