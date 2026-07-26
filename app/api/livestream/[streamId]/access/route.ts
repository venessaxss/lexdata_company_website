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
      {
        allowed: false,
        error: access.error,
        viewerCount: 0,
      },
      {
        status: access.status,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }

  const cutoff = new Date(Date.now() - 90000).toISOString();

  const { count } = await access.identity.admin
    .from("live_attendance")
    .select("id", { count: "exact", head: true })
    .eq("stream_id", streamId)
    .gte("last_seen_at", cutoff);

  return NextResponse.json(
    {
      allowed: true,
      viewerCount: count || 0,
      status: access.stream.status,
      isEnabled: access.stream.is_enabled,
    },
    {
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}
