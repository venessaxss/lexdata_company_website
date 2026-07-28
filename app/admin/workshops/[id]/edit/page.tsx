import { redirect } from "next/navigation";

export default async function WorkshopEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/workshops/${id}#overview`);
}
