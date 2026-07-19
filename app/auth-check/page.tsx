import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthCheckPage() {
  const profile = await getCurrentProfile();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Auth check</h1>
      <pre>
        {JSON.stringify(
          profile
            ? {
                loggedIn: true,
                email: profile.email,
                id: profile.id,
                role: profile.role,
                name: profile.full_name || profile.name || profile.display_name,
              }
            : {
                loggedIn: false,
              },
          null,
          2
        )}
      </pre>
    </main>
  );
}