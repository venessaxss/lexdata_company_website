import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { normalizeRole } from "@/lib/roles";

export default async function UnauthorizedPage({
  searchParams
}: {
  searchParams?: Promise<{ required?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const role = normalizeRole(profile?.role);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="card p-8">
        <p className="badge w-fit">Access control</p>
        <h1 className="mt-4 text-3xl font-bold">You do not have access to this page</h1>
        <p className="mt-3 text-slate-600">
          Your current role is <strong>{ROLE_LABELS[role]}</strong>. This page requires: {params?.required ?? "a different role"}.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard" className="btn-primary">Go to dashboard</Link>
          <Link href="/login" className="btn-light">Switch account</Link>
        </div>
      </div>
    </section>
  );
}
