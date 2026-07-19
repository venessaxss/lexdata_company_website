export const revalidate = 0;
export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/auth";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "manager"]);
  return <>{children}</>;
}
