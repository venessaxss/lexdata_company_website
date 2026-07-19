import Link from "next/link";
import { loginAction, signupAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || params.redirect || "/dashboard";
  const notice = params.error || params.message;

  return (
    <main className="min-h-screen bg-[#fbf6ed] px-4 py-16">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border-2 border-slate-950 bg-white shadow-[10px_10px_0_#17172f] md:grid md:grid-cols-[1fr_0.9fr]">
        <div className="bg-slate-950 p-8 text-white md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-300">
            Member access
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            Log in once. Stay inside your dashboard.
          </h1>
          <p className="mt-5 leading-8 text-slate-300">
            Access registrations, approvals, message replies, course management,
            and manager tools without being asked to log in again.
          </p>
          <Link href="/" className="mt-8 inline-flex text-sm font-bold text-blue-200">
            Back to homepage -&gt;
          </Link>
        </div>

        <div className="p-8 md:p-10">
          {notice ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              {notice}
            </div>
          ) : null}

          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Email</label>
              <input name="email" type="email" required autoComplete="email" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Password</label>
              <input name="password" type="password" required autoComplete="current-password" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white">
              Log in
            </button>
          </form>

          <div className="my-7 h-px bg-slate-200" />

          <form action={signupAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <h2 className="text-lg font-black text-slate-950">Create account</h2>
            <input name="email" type="email" required placeholder="Email" autoComplete="email" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input name="password" type="password" required placeholder="Password" autoComplete="new-password" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <button type="submit" className="w-full rounded-2xl border-2 border-slate-950 bg-[#8b93f8] px-5 py-3 text-sm font-black text-slate-950 shadow-[4px_4px_0_#17172f]">
              Create account
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
