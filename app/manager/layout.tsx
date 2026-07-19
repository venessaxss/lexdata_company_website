import { requireManagerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManagerOrAdmin("/manager");
  return <>{children}</>;
}
