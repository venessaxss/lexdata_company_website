import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  clearDurableAppSession,
  setDurableAppSession,
} from "@/lib/app-session";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await setDurableAppSession({
    id: user.id,
    email: user.email,
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}

export async function DELETE() {
  await clearDurableAppSession();

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}