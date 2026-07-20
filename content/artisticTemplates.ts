export type ArtisticTemplate = {
  id: "desk" | "orbit" | "archive" | "notes";
  label: string;
  accent: string;
};

export const artisticTemplates: ArtisticTemplate[] = [
  { id: "desk", label: "Research desk", accent: "Human judgment" },
  { id: "orbit", label: "Idea orbit", accent: "Context over opacity" },
  { id: "archive", label: "Living archive", accent: "Your work stays yours" },
  { id: "notes", label: "Margin notes", accent: "Researchers stay in control" },
];