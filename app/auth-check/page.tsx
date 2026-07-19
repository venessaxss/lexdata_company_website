import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthCheckPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Auth check</h1>

      {user ? (
        <pre>
          {JSON.stringify(
            {
              loggedIn: true,
              email: user.email,
              id: user.id,
            },
            null,
            2
          )}
        </pre>
      ) : (
        <pre>{JSON.stringify({ loggedIn: false }, null, 2)}</pre>
      )}
    </main>
  );
}