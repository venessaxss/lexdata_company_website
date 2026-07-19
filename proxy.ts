import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function redirectPreservingCookies(response: NextResponse, url: URL) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const fullPath = `${path}${request.nextUrl.search}`;

  const protectedPaths = [
    "/dashboard",
    "/manager",
    "/admin",
    "/my",
    "/speaker",
  ];

  const authPaths = ["/login", "/signup", "/register"];

  const isProtected = protectedPaths.some(
    (item) => path === item || path.startsWith(`${item}/`)
  );

  const isAuthPage = authPaths.includes(path);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", fullPath);
    return redirectPreservingCookies(response, url);
  }

  if (isAuthPage && user) {
    const next =
      request.nextUrl.searchParams.get("next") ||
      request.nextUrl.searchParams.get("redirect");

    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(next);
    url.search = "";
    return redirectPreservingCookies(response, url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|pdf|txt|xml)$).*)",
  ],
};