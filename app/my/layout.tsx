import { requireUser } from "@/lib/auth";

export default async function MyLearningLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
