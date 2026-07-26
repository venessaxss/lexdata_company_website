import { NextResponse } from "next/server";
import { authorizeLiveViewer } from "@/lib/livestream/authorize";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await context.params;
  const access = await authorizeLiveViewer(streamId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const now = new Date();

  const { data: existing } = await access.identity.admin
    .from("live_attendance")
    .select("id, joined_at, last_seen_at, watch_seconds")
    .eq("stream_id", streamId)
    .eq("user_id", access.identity.id)
    .maybeSingle();

  let elapsed = 0;

  if (existing?.last_seen_at) {
    elapsed = Math.floor(
      (now.getTime() - new Date(existing.last_seen_at).getTime()) / 1000
    );
    elapsed = Math.max(0, Math.min(90, elapsed));
  }

  const nextWatchSeconds =
    Number(existing?.watch_seconds || 0) + elapsed;

  const { error } = await access.identity.admin
    .from("live_attendance")
    .upsert(
      {
        stream_id: streamId,
        workshop_id: access.workshop.id,
        user_id: access.identity.id,
        joined_at: existing?.joined_at || now.toISOString(),
        last_seen_at: now.toISOString(),
        left_at: null,
        watch_seconds: nextWatchSeconds,
        updated_at: now.toISOString(),
      },
      { onConflict: "stream_id,user_id" }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    watchSeconds: nextWatchSeconds,
  });
}
