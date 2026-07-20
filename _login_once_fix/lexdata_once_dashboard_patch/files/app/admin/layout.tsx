import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");
  return <>{children}</>;
}
