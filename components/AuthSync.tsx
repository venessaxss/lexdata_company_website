"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

async function bootstrapDurableSession() {
  try {
    await fetch("/api/auth/bootstrap", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Navigation must not fail because the bootstrap helper is unavailable.
  }
}

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    void bootstrapDurableSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        void bootstrapDurableSession();
        return;
      }

      if (event === "SIGNED_OUT") {
        void fetch("/api/auth/bootstrap", {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }).finally(() => {
          if (mounted) {
            router.refresh();
          }
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}