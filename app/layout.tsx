import type { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import VisitTracker from "@/components/VisitTracker";
import { site } from "@/lib/site";
import { getLanguageDirection, normalizeLanguage } from "@/lib/languages";
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
  const cookieStore = await cookies();

  const currentLanguage = normalizeLanguage(
    cookieStore.get("lexdata_language")?.value
  );

  const direction = getLanguageDirection(currentLanguage);

  return (
    <html lang={currentLanguage} dir={direction}>
      <body>
        <VisitTracker />
        <Navbar />
        {children}
      </body>
    </html>
  );
}