"use client";

/**
 * AuthSync — mounted once in the root layout. Two jobs:
 *
 * 1. KEEP THE SESSION ALIVE CLIENT-SIDE. Creating the browser client
 *    starts supabase-js's automatic token refresh in the browser, which
 *    rewrites the auth cookies before they expire. Previously NOTHING on
 *    the client refreshed tokens, so the middleware was the single point
 *    of failure — one missed/dropped refresh killed the session and
 *    forced a re-login.
 *
 * 2. SYNC SERVER-RENDERED UI WITH AUTH STATE. On sign-in, sign-out, or a
 *    token refresh, router.refresh() re-renders server components (the
 *    Navbar!) so the header immediately stops showing Login/Register
 *    after login, on every page, with no stale router cache.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  const router = useRouter();
  const lastEvent = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION fires on every mount; refreshing then would loop.
      if (event === "INITIAL_SESSION") return;

      // Collapse duplicate consecutive events (e.g. double TOKEN_REFRESHED).
      if (event === lastEvent.current && event === "TOKEN_REFRESHED") return;
      lastEvent.current = event;

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
