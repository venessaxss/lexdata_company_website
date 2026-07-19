import { requireSpeakerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpeakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSpeakerOrAdmin("/speaker");
  return <>{children}</>;
}
