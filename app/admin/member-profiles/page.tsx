import ManagerMemberProfilesPage from "@/app/manager/member-profiles/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMemberProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; completed?: string }>;
}) {
  return <ManagerMemberProfilesPage searchParams={searchParams} />;
}