export const revalidate = 0;
export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  return <>{children}</>;
}
