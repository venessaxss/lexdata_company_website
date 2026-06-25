import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} | Data-driven Research Training Platform`,
  description: site.tagline
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
