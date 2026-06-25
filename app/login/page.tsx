import Link from "next/link";
import {
  loginWithGithub,
  loginWithGoogle,
  loginWithMagicLink,
  loginWithPassword
} from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Account access
        </p>
        <h1 className="mt-2 text-3xl font-bold">Login with password</h1>
        <p className="mt-2 text-sm text-slate-600">
          This avoids Supabase magic-link email limits. New users should register once,
          then login here with email and password.
        </p>

        <form action={loginWithPassword} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              required
              className="input mt-2"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              required
              className="input mt-2"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button className="btn-primary w-full">Login</button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          New user?{" "}
          <Link href="/register" className="font-semibold text-slate-950 underline">
            Create an account
          </Link>
        </p>

        {params.message ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            {params.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold">Fast login</h2>
          <p className="mt-2 text-sm text-slate-600">
            Social login does not use your Supabase magic-link email quota.
          </p>

          <div className="mt-5 space-y-3">
            <form action={loginWithGoogle}>
              <button className="btn-light w-full" type="submit">
                Continue with Google
              </button>
            </form>

            <form action={loginWithGithub}>
              <button className="btn-light w-full" type="submit">
                Continue with GitHub
              </button>
            </form>
          </div>
        </div>

        <details className="card p-6">
          <summary className="cursor-pointer text-lg font-bold">
            Backup: magic-link login
          </summary>
          <p className="mt-2 text-sm text-slate-600">
            Use this only when needed. It sends email and may hit rate limits on
            Supabase free/default email settings.
          </p>

          <form action={loginWithMagicLink} className="mt-4 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                required
                className="input mt-2"
                placeholder="you@example.com"
              />
            </div>
            <button className="btn-light w-full">Send magic link</button>
          </form>
        </details>
      </div>
    </section>
  );
}
