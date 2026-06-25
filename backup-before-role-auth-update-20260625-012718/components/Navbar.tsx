import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

function canTeach(role: string | null) {
  return role === "speaker" || role === "admin";
}

function canManage(role: string | null) {
  return role === "manager" || role === "admin";
}

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? "student";
    fullName = profile?.full_name ?? user.email ?? "Account";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="LexData Academy logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <div className="leading-tight">
            <div className="text-xl font-bold tracking-tight text-slate-900">
              LexData Academy
            </div>
            <div className="text-xs text-slate-500">
              Courses · Workshops · Research Training
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/courses" className="nav-link">Courses</Link>
          <Link href="/workshops" className="nav-link">Workshops</Link>

          {user ? (
            <>
              <details className="group relative">
                <summary className="nav-link cursor-pointer list-none">
                  My Learning ▾
                </summary>
                <div className="absolute right-0 top-9 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="nav-section px-2 pb-2">Student center</p>
                  <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Overview dashboard</Link>
                  <Link href="/my/courses" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Purchased courses</Link>
                  <Link href="/my/workshops" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Registered workshops</Link>
                  <Link href="/my/payments" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Invoices & payments</Link>
                </div>
              </details>

              {canTeach(role) ? (
                <details className="group relative">
                  <summary className="nav-link cursor-pointer list-none">
                    Speaker ▾
                  </summary>
                  <div className="absolute right-0 top-9 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <p className="nav-section px-2 pb-2">Training delivery</p>
                    <Link href="/speaker/sessions" className="block rounded-lg px-3 py-2 hover:bg-slate-100">My training sessions</Link>
                    <Link href="/speaker/attendees" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Attendee lists</Link>
                  </div>
                </details>
              ) : null}

              {canManage(role) ? (
                <details className="group relative">
                  <summary className="nav-link cursor-pointer list-none">
                    Management ▾
                  </summary>
                  <div className="absolute right-0 top-9 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <p className="nav-section px-2 pb-2">Admin and finance</p>
                    {role === "admin" ? (
                      <>
                        <Link href="/admin/courses" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Manage courses</Link>
                        <Link href="/admin/workshops" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Manage workshops</Link>
                      </>
                    ) : null}
                    <Link href="/manager/payments" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Payment management</Link>
                    <Link href="/manager/registrations" className="block rounded-lg px-3 py-2 hover:bg-slate-100">Registration records</Link>
                  </div>
                </details>
              ) : null}

              <div className="ml-2 hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 md:block">
                {fullName} · {role}
              </div>

              <form action={signOut}>
                <button type="submit" className="btn-light">Logout</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-primary">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
