import Link from "next/link";
import { loginWithGithub, loginWithGoogle, registerWithPassword } from "../login/actions";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          New account
        </p>
        <h1 className="mt-2 text-3xl font-bold">Register with password</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is the best development method when magic-link emails keep reaching
          rate limits.
        </p>

        <form action={registerWithPassword} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              name="full_name"
              className="input mt-2"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

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
              minLength={8}
              className="input mt-2"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              className="input mt-2"
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </div>

          <button className="btn-primary w-full">Create account</button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-slate-950 underline">
            Login
          </Link>
        </p>

        {params.message ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            {params.message}
          </p>
        ) : null}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold">Register with social login</h2>
        <p className="mt-2 text-sm text-slate-600">
          Google/GitHub registration is easier for users and avoids Supabase email
          magic-link limits.
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

        <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          <p className="font-semibold">Important setting</p>
          <p className="mt-1">
            If Supabase email confirmation is ON, password registration still sends
            a confirmation email. For development, turn confirmation OFF. For
            production, use custom SMTP or social login.
          </p>
        </div>
      </div>
    </section>
  );
}
