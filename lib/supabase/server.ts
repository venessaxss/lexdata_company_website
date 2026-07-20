import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";

function fallbackUserFromDurable(session: {
  id: string;
  email?: string | null;
}) {
  return {
    id: session.id,
    email: session.email || undefined,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date(0).toISOString(),
  };
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
          // proxy.ts refreshes Supabase cookies at the request boundary.
        }
      },
    },
  });

  const originalGetUser = client.auth.getUser.bind(client.auth);

  (client.auth as any).getUser = async (jwt?: string) => {
    try {
      const result = await originalGetUser(jwt);

      if (result?.data?.user) {
        if (!jwt) {
          try {
            await setDurableAppSession({
              id: result.data.user.id,
              email: result.data.user.email,
            });
          } catch {
            // Cookie writes are not allowed in every Server Component.
          }
        }

        return result;
      }

      if (jwt) {
        return result;
      }
    } catch {
      if (jwt) {
        throw new Error("Unable to validate supplied JWT.");
      }
    }

    const durable = await getDurableAppSession();

    if (!durable?.id) {
      return {
        data: { user: null },
        error: null,
      };
    }

    return {
      data: {
        user: fallbackUserFromDurable(durable),
      },
      error: null,
    };
  };

  const originalGetClaims = client.auth.getClaims.bind(client.auth);

  (client.auth as any).getClaims = async (...args: any[]) => {
    try {
      const result = await originalGetClaims(...args);
      const claims = result?.data?.claims as Record<string, any> | undefined;

      if (claims?.sub) {
        try {
          await setDurableAppSession({
            id: String(claims.sub),
            email: typeof claims.email === "string" ? claims.email : null,
          });
        } catch {
          // Cookie writes are not allowed in every Server Component.
        }

        return result;
      }
    } catch {
      // Continue to the durable session fallback.
    }

    const durable = await getDurableAppSession();

    if (!durable?.id) {
      return {
        data: { claims: null },
        error: null,
      };
    }

    const now = Math.floor(Date.now() / 1000);

    return {
      data: {
        claims: {
          sub: durable.id,
          email: durable.email || null,
          role: "authenticated",
          aud: "authenticated",
          iat: durable.iat || now,
          exp: durable.exp || now + 3600,
          user_metadata: {},
          app_metadata: {},
        },
      },
      error: null,
    };
  };

  return client;
}