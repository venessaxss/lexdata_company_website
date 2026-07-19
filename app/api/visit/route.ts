import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VisitPayload = {
  visitor_id?: string;
  path?: string;
  title?: string;
  referrer?: string;
  user_agent?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VisitPayload;

    const path = String(payload.path || "").trim();

    if (!path || path.startsWith("/api") || path.startsWith("/_next")) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userRole: string | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      userRole = normalizeRole(profile?.role);
    }

    const admin = createAdminClient();

    await admin.from("site_visit_records").insert({
      visitor_id: payload.visitor_id || null,
      user_id: user?.id || null,
      user_role: userRole,
      path,
      title: payload.title || null,
      referrer: payload.referrer || null,
      user_agent: payload.user_agent || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}