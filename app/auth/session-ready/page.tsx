import AuthSessionReady from "@/components/AuthSessionReady";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function SessionReadyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);

  return <AuthSessionReady nextPath={nextPath} />;
}