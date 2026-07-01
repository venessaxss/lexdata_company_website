"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [isReady, setIsReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("Checking reset link...");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function prepareRecoverySession() {
      try {
        const url = new URL(window.location.href);

        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage(error.message);
            setIsReady(false);
            return;
          }

          window.history.replaceState({}, document.title, "/reset-password");
          setMessage("Reset link verified. Please enter your new password.");
          setIsReady(true);
          return;
        }

        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setMessage(error.message);
            setIsReady(false);
            return;
          }

          window.history.replaceState({}, document.title, "/reset-password");
          setMessage("Reset link verified. Please enter your new password.");
          setIsReady(true);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setMessage("Please enter your new password.");
          setIsReady(true);
          return;
        }

        setMessage(
          "Auth session missing. Please request a new password reset link and open it in the same browser."
        );
        setIsReady(false);
      } catch {
        setMessage("Could not verify the reset link. Please request a new one.");
        setIsReady(false);
      }
    }

    prepareRecoverySession();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsUpdating(true);
    setMessage("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setIsUpdating(false);
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();

    router.push(
      "/login?message=Password updated successfully. Please login with your new password."
    );
  }

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
          Reset password
        </h1>

        <p className="mt-3 text-slate-600">
          Enter a new password for your LexData account.
        </p>

        {message ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              New password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              disabled={!isReady || isUpdating}
              className="w-full rounded-xl border px-4 py-3 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm new password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat new password"
              disabled={!isReady || isUpdating}
              className="w-full rounded-xl border px-4 py-3 disabled:bg-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={!isReady || isUpdating}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isUpdating ? "Updating..." : "Update password"}
          </button>
        </form>

        {!isReady ? (
          <Link
            href="/forgot-password"
            className="mt-6 inline-flex text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            Request a new reset link
          </Link>
        ) : null}
      </div>
    </main>
  );
}