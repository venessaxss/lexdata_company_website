import { createClient } from "@/lib/supabase/client";

export function subscribeUnlock(userId: string, callback: () => void) {
  const supabase = createClient();

  return supabase
    .channel("unlock-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "session_access_logs",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();
}