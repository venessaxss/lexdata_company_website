import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifiedFallbackUser() {
  const fallback = await getDurableAppSession();
  if (!fallback?.id) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(fallback.id);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies.
          // proxy.ts writes refreshed Supabase cookies at the request boundary.
        }
      },
    },
  });

  const originalGetUser = client.auth.getUser.bind(client.auth);

  (client.auth as any).getUser = async (jwt?: string) => {
    const result = await originalGetUser(jwt);

    if (result?.data?.user) {
      if (!jwt) {
        try {
          await setDurableAppSession({
            id: result.data.user.id,
            email: result.data.user.email,
          });
        } catch {
          // Cookie writes are not allowed from every Server Component.
        }
      }

      return result;
    }

    if (jwt) {
      return result;
    }

    const fallbackUser = await verifiedFallbackUser();

    if (!fallbackUser) {
      return result;
    }

    return {
      data: { user: fallbackUser },
      error: null,
    };
  };

  const originalGetClaims = client.auth.getClaims.bind(client.auth);

  (client.auth as any).getClaims = async (...args: any[]) => {
    const result = await originalGetClaims(...args);
    const claims = result?.data?.claims as Record<string, any> | undefined;

    if (claims?.sub) {
      try {
        await setDurableAppSession({
          id: String(claims.sub),
          email: typeof claims.email === "string" ? claims.email : null,
        });
      } catch {
        // Cookie writes are not allowed from every Server Component.
      }

      return result;
    }

    const fallbackUser = await verifiedFallbackUser();

    if (!fallbackUser) {
      return result;
    }

    const fallback = await getDurableAppSession();
    const now = Math.floor(Date.now() / 1000);

    return {
      data: {
        claims: {
          sub: fallbackUser.id,
          email: fallbackUser.email,
          role: "authenticated",
          aud: "authenticated",
          iat: fallback?.iat || now,
          exp: fallback?.exp || now + 3600,
          user_metadata: fallbackUser.user_metadata || {},
          app_metadata: fallbackUser.app_metadata || {},
        },
      },
      error: null,
    };
  };

  return client;
}