import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const slug =
    url.searchParams.get("slug") || "from-research-idea-to-publications";

  const admin = createAdminClient();

  const { data: exactWorkshop, error: exactError } = await admin
    .from("workshops")
    .select(
      `
      id,
      title,
      slug,
      is_published,
      recruitment_status,
      process_status,
      created_at,
      updated_at
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  const { data: similarWorkshops, error: similarError } = await admin
    .from("workshops")
    .select(
      `
      id,
      title,
      slug,
      is_published,
      created_at,
      updated_at
    `
    )
    .or("title.ilike.%research%,title.ilike.%publication%,slug.ilike.%research%")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    ok: true,
    checkedSlug: slug,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    exactWorkshop,
    exactError,
    similarWorkshops,
    similarError,
  });
}
