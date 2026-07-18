import ManagerCourseEnrollmentsPage from "@/app/manager/course-enrollments/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCourseEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return <ManagerCourseEnrollmentsPage searchParams={searchParams} />;
}