import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6">
        <p className="badge inline-block">LexData account</p>
        <h1 className="mt-4 text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use passwordless email login. Supabase sends a magic link to your email.
        </p>
        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input mt-2" placeholder="you@example.com" />
          </div>
          <button className="btn-primary w-full">Send login link</button>
        </form>
        {params.message ? <p className="mt-4 text-sm text-slate-600">{params.message}</p> : null}
      </div>
    </section>
  );
}
