import Link from "next/link";
import { loginAction, signupAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || "/dashboard";

  return (
    <main className="lex-auth-page">
      <section className="lex-auth-card">
        <p>Member access</p>
        <h1>Access your LexData account</h1>
        <span>
          Log in once to access your dashboard, workshops, admin tools, manager
          pages, and learning materials.
        </span>

        {params.error ? (
          <div className="lex-auth-error">{params.error}</div>
        ) : null}

        <form action={loginAction} className="lex-auth-form">
          <input type="hidden" name="next" value={next} />

          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit">Log in</button>
        </form>

        <form action={signupAction} className="lex-auth-form lex-auth-signup">
          <input type="hidden" name="next" value={next} />

          <h2>Create account</h2>

          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
          </label>

          <button type="submit">Create account</button>
        </form>

        <Link href="/">Back to homepage</Link>
      </section>
    </main>
  );
}