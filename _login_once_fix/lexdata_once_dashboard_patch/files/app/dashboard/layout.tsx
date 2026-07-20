import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile("/dashboard");
  return <>{children}</>;
}
