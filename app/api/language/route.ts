import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const language = normalizeLanguage(payload?.language);

    const response = NextResponse.json({
      ok: true,
      language,
    });

    response.cookies.set("lexdata_language", language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();

      await admin
        .from("profiles")
        .update({
          preferred_language: language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Could not update language",
      },
      {
        status: 400,
      }
    );
  }
}