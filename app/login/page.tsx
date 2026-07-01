import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function login(formData: FormData) {
  "use server";

  const email = field(formData, "email");
  const password = field(formData, "password");
  const redirectTo = field(formData, "redirect") || "/dashboard";

  if (!email || !password) {
    redirect("/login?message=Email and password are required");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const { message, redirect: redirectPath } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to homepage
        </Link>

        <h1 className="mt-6 text-4xl font-black text-slate-950">Login</h1>

        <p className="mt-3 text-slate-600">
          Login to access your LexData dashboard, workshop registrations,
          messages, and learning materials.
        </p>

        {message ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <form action={login} className="mt-6 grid gap-5">
          <input
            type="hidden"
            name="redirect"
            value={redirectPath || "/dashboard"}
          />

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

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              name="password"
              type="password"
              required
              placeholder="Your password"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Login
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link
            href="/forgot-password"
            className="font-semibold text-slate-600 hover:text-slate-950"
          >
            Forgot password?
          </Link>

          <p className="text-slate-600">
            Do not have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-slate-950 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}