import AboutEditor from "@/components/AboutEditor";

export const dynamic = "force-dynamic";

// /manager/* is already gated to manager+admin by app/manager/layout.tsx.
export default async function ManagerAboutPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return <AboutEditor returnTo="/manager/about" message={message} />;
}
