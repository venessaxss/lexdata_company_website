import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return "http://localhost:3000";
  }

  return siteUrl.replace(/\/$/, "");
}

async function sendPasswordResetEmail(formData: FormData) {
  "use server";

  const email = field(formData, "email");

  if (!email) {
    redirect("/forgot-password?message=Email is required");
  }

  const siteUrl = getSiteUrl();

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/forgot-password?message=Password reset email sent. Please check your inbox."
  );
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to login
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Forgot password
        </h1>

        <p className="mt-3 text-slate-600">
          Enter your account email. We will send you a password reset link.
        </p>

        {message ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <form action={sendPasswordResetEmail} className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Send reset link
          </button>
        </form>

        <div className="mt-6">
          <Link
            href="/signup"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            Need an account? Create account
          </Link>
        </div>
      </div>
    </main>
  );
}