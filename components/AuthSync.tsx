"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const supabase = createClient();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "INITIAL_SESSION") return;

        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          router.refresh();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("AuthSync failed:", error);
      return;
    }
  }, [router]);

  return null;
}