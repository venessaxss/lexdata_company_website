import { NextResponse } from "next/server";
import {
  authorizeLiveViewer,
  playbackIdentifier,
} from "@/lib/livestream/authorize";
import { createPlaybackToken } from "@/lib/livestream/cloudflare";

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
      {
        status: access.status,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }

  if (!access.stream.is_enabled) {
    return NextResponse.json(
      { error: "This livestream input is disabled." },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }

  try {
    const playback = await createPlaybackToken(
      playbackIdentifier(access.stream)
    );

    return NextResponse.json(playback, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create playback access.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
