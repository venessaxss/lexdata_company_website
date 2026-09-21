import fs from "fs";
import path from "path";

export type Partner = {
  slug: string;
  name: string;
  type?: string;
  image?: string;
  logo?: string;
  description: string;
  website?: string;
  workshop?: { title: string; href: string };
};

export function getAllPartners(): Partner[] {
  const file = path.join(process.cwd(), "content", "partners", "partners.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}