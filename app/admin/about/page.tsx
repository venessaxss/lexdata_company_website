import AboutEditor from "@/components/AboutEditor";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  // Managers AND admins may edit the About page.
  await requireRole(["admin", "manager"]);
  const { message } = await searchParams;
  return <AboutEditor returnTo="/admin/about" message={message} />;
}
