import { requireRole } from "@/lib/auth";

export default async function SpeakerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["speaker"]);
  return <>{children}</>;
}
