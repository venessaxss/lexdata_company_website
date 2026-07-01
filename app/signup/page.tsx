import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function signup(formData: FormData) {
  "use server";

  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirm_password");
  const redirectTo = field(formData, "redirect") || "/dashboard";

  if (!fullName || !email || !password || !confirmPassword) {
    redirect("/signup?message=Please fill in all required fields");
  }

  if (password.length < 8) {
    redirect("/signup?message=Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    redirect("/signup?message=Passwords do not match");
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(
        redirectTo
      )}`,
      data: {
        full_name: fullName,
        role: "member",
      },
    },
  });

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`);
  }

  if (data.user?.id) {
    const admin = createAdminClient();

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
        role: "member",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );
  }

  if (data.session) {
    redirect(redirectTo);
  }

  redirect(
    "/login?message=Account created. Please check your email to confirm your account, then login."
  );
}

export default async function SignupPage({
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

        <h1 className="mt-6 text-4xl font-black text-slate-950">
          Create account
        </h1>

        <p className="mt-3 text-slate-600">
          Create a LexData member account to register for workshops, receive
          messages, and access learning materials.
        </p>

        {message ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <form action={signup} className="mt-6 grid gap-5">
          <input
            type="hidden"
            name="redirect"
            value={redirectPath || "/dashboard"}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full name
            </label>

            <input
              name="full_name"
              required
              placeholder="Your full name"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

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
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm password
            </label>

            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              placeholder="Repeat your password"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-slate-950 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}