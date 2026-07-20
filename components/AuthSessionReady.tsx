"use client";

import { useEffect, useState } from "react";

export default function AuthSessionReady({
  nextPath,
}: {
  nextPath: string;
}) {
  const [message, setMessage] = useState("Securing your session...");

  useEffect(() => {
    let active = true;

    async function continueLogin() {
      try {
        await fetch("/api/auth/bootstrap", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        setMessage("Opening your dashboard...");
      } catch {
        if (!active) return;

        setMessage("Opening your dashboard...");
      }

      window.location.replace(nextPath);
    }

    void continueLogin();

    return () => {
      active = false;
    };
  }, [nextPath]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
          LexData
        </p>
        <h1 className="mt-4 text-3xl font-black">Login successful</h1>
        <p className="mt-4 text-slate-300">{message}</p>
      </div>
    </main>
  );
}