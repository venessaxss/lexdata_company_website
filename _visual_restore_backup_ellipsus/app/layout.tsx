import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import VisitTracker from "@/components/VisitTracker";
import AutoTranslator from "@/components/AutoTranslator";
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
      <body>
        <VisitTracker />
        <AutoTranslator language={language} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}