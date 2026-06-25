import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="LexData Logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />

          <div className="leading-tight">
            <div className="text-xl font-bold tracking-tight text-slate-900">
              LexData
            </div>
            <div className="text-xs text-slate-500">
              Learn Data, AI and Research
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-5 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>

          <Link href="/courses" className="hover:text-slate-950">
            Courses
          </Link>

          <Link href="/dashboard" className="hover:text-slate-950">
            Dashboard
          </Link>

          {role === "admin" && (
            <Link href="/admin/courses" className="hover:text-slate-950">
              Admin
            </Link>
          )}

          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}