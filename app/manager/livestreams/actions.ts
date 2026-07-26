"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/auth";
import {
  createLiveInput,
  listLiveInputVideos,
  setLiveInputEnabled,
  streamConfig,
} from "@/lib/livestream/cloudflare";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullable(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/manager/livestreams";
  }
  return value;
}

function feedback(
  path: string,
  key: "message" | "error",
  message: string
) {
  const url = new URL(path, "http://local");
  url.searchParams.set(key, message);
  return `${url.pathname}${url.search}${url.hash}`;
}

function iso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function refresh(slug?: string | null) {
  revalidatePath("/manager/livestreams");
  revalidatePath("/admin/livestreams");
  revalidatePath("/workshops");

  if (slug) {
    revalidatePath(`/workshops/${slug}`);
    revalidatePath(`/workshops/${slug}/live`);
  }
}

export async function createWorkshopLivestreamAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin("/manager/livestreams");
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/livestreams"
  );
  const workshopId = text(formData, "workshop_id");

  if (!workshopId) {
    redirect(feedback(returnTo, "error", "Choose a workshop."));
  }

  const { data: workshop, error: workshopError } = await actor.admin
    .from("workshops")
    .select("id, title, slug")
    .eq("id", workshopId)
    .maybeSingle();

  if (workshopError || !workshop) {
    redirect(
      feedback(
        returnTo,
        "error",
        workshopError?.message || "Workshop not found."
      )
    );
  }

  const { data: existing } = await actor.admin
    .from("workshop_live_streams")
    .select("id")
    .eq("workshop_id", workshopId)
    .maybeSingle();

  if (existing) {
    redirect(
      feedback(
        returnTo,
        "error",
        "This workshop already has a livestream."
      )
    );
  }

  try {
    const input = await createLiveInput(
      `${workshop.title || "LexData workshop"} live`
    );
    const config = streamConfig();

    const { error } = await actor.admin
      .from("workshop_live_streams")
      .insert({
        workshop_id: workshopId,
        title:
          nullable(formData, "title") ||
          `${workshop.title || "Workshop"} live`,
        live_input_uid: input.uid,
        rtmps_url: input.rtmps?.url || null,
        stream_key: input.rtmps?.streamKey || null,
        customer_code: config.customerCode,
        status: "scheduled",
        scheduled_start: iso(text(formData, "scheduled_start")),
        scheduled_end: iso(text(formData, "scheduled_end")),
        is_enabled: true,
        created_by: actor.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      try {
        await setLiveInputEnabled(input.uid, false);
      } catch {
        // Best-effort cleanup.
      }

      redirect(feedback(returnTo, "error", error.message));
    }

    refresh(workshop.slug);

    redirect(feedback(returnTo, "message", "Livestream input created."));
  } catch (error) {
    redirect(
      feedback(
        returnTo,
        "error",
        error instanceof Error
          ? error.message
          : "Could not create livestream."
      )
    );
  }
}

export async function updateWorkshopLivestreamAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin("/manager/livestreams");
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/livestreams"
  );
  const id = text(formData, "id");
  const status = text(formData, "status");
  const allowed = ["scheduled", "waiting", "live", "ended", "cancelled"];

  if (!id || !allowed.includes(status)) {
    redirect(feedback(returnTo, "error", "Invalid livestream update."));
  }

  const { data: stream } = await actor.admin
    .from("workshop_live_streams")
    .select(
      `
      id,
      workshops:workshop_id (
        slug
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  const { error } = await actor.admin
    .from("workshop_live_streams")
    .update({
      title: nullable(formData, "title"),
      status,
      scheduled_start: iso(text(formData, "scheduled_start")),
      scheduled_end: iso(text(formData, "scheduled_end")),
      recording_uid: nullable(formData, "recording_uid"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(feedback(returnTo, "error", error.message));
  }

  const workshop = Array.isArray(stream?.workshops)
    ? stream?.workshops[0]
    : stream?.workshops;

  refresh(workshop?.slug || null);
  redirect(feedback(returnTo, "message", "Livestream settings updated."));
}

export async function setWorkshopLivestreamEnabledAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin("/manager/livestreams");
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/livestreams"
  );
  const id = text(formData, "id");
  const enabled = text(formData, "enabled") === "true";

  const { data: stream, error } = await actor.admin
    .from("workshop_live_streams")
    .select(
      `
      id,
      live_input_uid,
      workshops:workshop_id (
        slug
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !stream) {
    redirect(
      feedback(
        returnTo,
        "error",
        error?.message || "Livestream not found."
      )
    );
  }

  try {
    await setLiveInputEnabled(stream.live_input_uid, enabled);

    const { error: updateError } = await actor.admin
      .from("workshop_live_streams")
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      redirect(feedback(returnTo, "error", updateError.message));
    }

    const workshop = Array.isArray(stream.workshops)
      ? stream.workshops[0]
      : stream.workshops;

    refresh(workshop?.slug || null);

    redirect(
      feedback(
        returnTo,
        "message",
        enabled ? "Live input enabled." : "Live input disabled."
      )
    );
  } catch (error) {
    redirect(
      feedback(
        returnTo,
        "error",
        error instanceof Error
          ? error.message
          : "Could not update live input."
      )
    );
  }
}

export async function syncWorkshopLivestreamAction(
  formData: FormData
) {
  const actor = await requireManagerOrAdmin("/manager/livestreams");
  const returnTo = safeReturnTo(
    text(formData, "return_to") || "/manager/livestreams"
  );
  const id = text(formData, "id");

  const { data: stream, error } = await actor.admin
    .from("workshop_live_streams")
    .select(
      `
      id,
      live_input_uid,
      workshops:workshop_id (
        slug
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !stream) {
    redirect(
      feedback(
        returnTo,
        "error",
        error?.message || "Livestream not found."
      )
    );
  }

  try {
    const videos = await listLiveInputVideos(stream.live_input_uid);
    const liveVideo = videos.find(
      (video) => video.status?.state === "live-inprogress"
    );
    const recording = videos
      .filter(
        (video) =>
          video.readyToStream || video.status?.state === "ready"
      )
      .sort((a, b) =>
        String(b.created || "").localeCompare(String(a.created || ""))
      )[0];

    const nextStatus = liveVideo
      ? "live"
      : recording
        ? "ended"
        : "scheduled";

    const { error: updateError } = await actor.admin
      .from("workshop_live_streams")
      .update({
        status: nextStatus,
        recording_uid: recording?.uid || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      redirect(feedback(returnTo, "error", updateError.message));
    }

    const workshop = Array.isArray(stream.workshops)
      ? stream.workshops[0]
      : stream.workshops;

    refresh(workshop?.slug || null);
    redirect(feedback(returnTo, "message", "Stream synchronized."));
  } catch (error) {
    redirect(
      feedback(
        returnTo,
        "error",
        error instanceof Error
          ? error.message
          : "Could not synchronize stream."
      )
    );
  }
}
