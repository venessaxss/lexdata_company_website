import { NextResponse } from "next/server";
import { authorizeLiveViewer } from "@/lib/livestream/authorize";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await context.params;
  const access = await authorizeLiveViewer(streamId);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const { data, error } = await access.identity.admin
    .from("live_chat_messages")
    .select("id, user_id, display_name, body, created_at")
    .eq("stream_id", streamId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    messages: (data || []).reverse(),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await context.params;
  const access = await authorizeLiveViewer(streamId);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  let payload: any;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid chat payload." },
      { status: 400 }
    );
  }

  const body = String(payload?.body || "").trim();

  if (!body || body.length > 500) {
    return NextResponse.json(
      { error: "Chat messages must contain 1 to 500 characters." },
      { status: 400 }
    );
  }

  const displayName =
    access.identity.full_name ||
    access.identity.name ||
    access.identity.display_name ||
    access.identity.email?.split("@")[0] ||
    "Participant";

  const { error } = await access.identity.admin
    .from("live_chat_messages")
    .insert({
      stream_id: streamId,
      workshop_id: access.workshop.id,
      user_id: access.identity.id,
      display_name: displayName,
      body,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
