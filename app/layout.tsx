import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { site } from "@/lib/site";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: `${site.name} | Data-driven Research Training Platform`,
  description: site.tagline
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VisitTracker />
        <Navbar />
     
        <main>{children}</main>
      </body>
    </html>
  );
}
