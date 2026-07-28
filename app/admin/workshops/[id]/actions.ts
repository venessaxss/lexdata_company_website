"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullable(formData: FormData, key: string) {
  return field(formData, key) || null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(field(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workshopPath(workshopId: string, anchor?: string) {
  const base = `/admin/workshops/${workshopId}`;
  return anchor ? `${base}#${anchor}` : base;
}

function messagePath(
  workshopId: string,
  message: string,
  type: "message" | "error" = "message",
  anchor?: string
) {
  const base = `/admin/workshops/${workshopId}`;
  return `${base}?${type}=${encodeURIComponent(message)}${
    anchor ? `#${anchor}` : ""
  }`;
}

function toIso(date: string | null, time: string | null) {
  if (!date || !time) return null;

  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function revalidateWorkshop(workshopId: string) {
  const supabase = createAdminClient();
  const { data: workshop } = await supabase
    .from("workshops")
    .select("slug")
    .eq("id", workshopId)
    .maybeSingle();

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${workshopId}`);
  revalidatePath("/manager/workshops");
  revalidatePath("/manager/registrations");

  if (workshop?.slug) {
    revalidatePath(`/workshops/${workshop.slug}`);
    revalidatePath(`/workshops/${workshop.slug}/live`);
  }
}

async function nextSessionOrder(workshopId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("workshop_sessions")
    .select("display_order")
    .eq("workshop_id", workshopId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.display_order || 0) + 1;
}

async function nextSubsessionOrder(sessionId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("workshop_subsessions")
    .select("display_order")
    .eq("session_id", sessionId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.display_order || 0) + 1;
}

export async function updateWorkshopOverviewAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const title = field(formData, "title");

  if (!workshopId || !title) {
    redirect("/admin/workshops?error=Missing workshop ID or title");
  }

  const slug = field(formData, "slug") || slugify(title);
  const shortDescription = nullable(formData, "short_description");
  const description = nullable(formData, "description");
  const speaker = nullable(formData, "speaker");
  const startDate = nullable(formData, "start_date");
  const imageUrl = nullable(formData, "image_url");
  const materialUrl = nullable(formData, "material_url");
  const published = checked(formData, "is_published");

  const { error } = await supabase
    .from("workshops")
    .update({
      title,
      slug,
      short_description: shortDescription,
      summary: shortDescription,
      description,
      instructor: speaker,
      speaker,
      level: field(formData, "level") || "All levels",
      language: field(formData, "language") || "English",
      format: field(formData, "format") || "Online",
      location: nullable(formData, "location"),
      start_date: startDate,
      date: startDate,
      end_date: nullable(formData, "end_date"),
      duration: nullable(formData, "duration"),
      price: numberValue(formData, "price", 0),
      currency: field(formData, "currency") || "USD",
      capacity: numberValue(formData, "capacity", 0),
      image_url: imageUrl,
      cover_url: imageUrl,
      thumbnail_url: imageUrl,
      material_url: materialUrl,
      materials_url: materialUrl,
      resource_url: materialUrl,
      file_url: materialUrl,
      is_featured: checked(formData, "is_featured"),
      is_published: published,
      is_active: published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workshopId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "overview"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Workshop overview saved", "message", "overview"));
}

export async function updateWorkshopStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");

  if (!workshopId) {
    redirect("/admin/workshops?error=Missing workshop ID");
  }

  const { error } = await supabase
    .from("workshops")
    .update({
      recruitment_status: field(formData, "recruitment_status") || "open",
      process_status: field(formData, "process_status") || "not_started",
      status_note: nullable(formData, "status_note"),
      internal_status_note: nullable(formData, "internal_status_note"),
      status_updated_at: new Date().toISOString(),
      status_updated_by: actor.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workshopId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "status"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Workshop status saved", "message", "status"));
}

export async function createSessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const title = field(formData, "title");
  const sessionDate = nullable(formData, "session_date");
  const startTime = nullable(formData, "start_time");
  const endTime = nullable(formData, "end_time");

  if (!workshopId || !title || !sessionDate || !startTime || !endTime) {
    redirect(
      messagePath(
        workshopId,
        "Session title, date, start time, and end time are required",
        "error",
        "schedule"
      )
    );
  }

  const startsAt = toIso(sessionDate, startTime);
  const endsAt = toIso(sessionDate, endTime);

  if (!startsAt || !endsAt) {
    redirect(messagePath(workshopId, "Invalid session date or time", "error", "schedule"));
  }

  const requestedOrder = field(formData, "display_order");
  const displayOrder = requestedOrder
    ? numberValue(formData, "display_order", 0)
    : await nextSessionOrder(workshopId);

  const { error } = await supabase.from("workshop_sessions").insert({
    workshop_id: workshopId,
    title,
    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,
    starts_at: startsAt,
    ends_at: endsAt,
    location: nullable(formData, "location"),
    meeting_url: nullable(formData, "meeting_url"),
    recording_url: nullable(formData, "recording_url"),
    material_url: nullable(formData, "material_url"),
    display_order: displayOrder,
    is_active: checked(formData, "is_active"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Major session added", "message", "schedule"));
}

export async function updateSessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const sessionDate = nullable(formData, "session_date");
  const startTime = nullable(formData, "start_time");
  const endTime = nullable(formData, "end_time");

  if (!workshopId || !sessionId) {
    redirect("/admin/workshops?error=Missing workshop or session ID");
  }

  const startsAt = toIso(sessionDate, startTime);
  const endsAt = toIso(sessionDate, endTime);

  if (!startsAt || !endsAt) {
    redirect(messagePath(workshopId, "Invalid session date or time", "error", "schedule"));
  }

  const { error } = await supabase
    .from("workshop_sessions")
    .update({
      title: field(formData, "title") || "Workshop Session",
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      starts_at: startsAt,
      ends_at: endsAt,
      location: nullable(formData, "location"),
      meeting_url: nullable(formData, "meeting_url"),
      recording_url: nullable(formData, "recording_url"),
      material_url: nullable(formData, "material_url"),
      display_order: numberValue(formData, "display_order", 0),
      is_active: checked(formData, "is_active"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("workshop_id", workshopId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Session saved", "message", "schedule"));
}

export async function deleteSessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");

  const { error } = await supabase
    .from("workshop_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("workshop_id", workshopId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Session deleted", "message", "schedule"));
}

export async function moveSessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const direction = field(formData, "direction");

  const { data, error } = await supabase
    .from("workshop_sessions")
    .select("id, display_order, session_date, start_time, created_at")
    .eq("workshop_id", workshopId)
    .order("display_order", { ascending: true })
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  const ordered = [...(data || [])];
  const currentIndex = ordered.findIndex((item) => item.id === sessionId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= ordered.length
  ) {
    redirect(workshopPath(workshopId, "schedule"));
  }

  [ordered[currentIndex], ordered[targetIndex]] = [
    ordered[targetIndex],
    ordered[currentIndex],
  ];

  for (let index = 0; index < ordered.length; index += 1) {
    const { error: updateError } = await supabase
      .from("workshop_sessions")
      .update({
        display_order: index + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ordered[index].id);

    if (updateError) {
      redirect(messagePath(workshopId, updateError.message, "error", "schedule"));
    }
  }

  await revalidateWorkshop(workshopId);
  redirect(workshopPath(workshopId, "schedule"));
}

export async function createSubsessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const title = field(formData, "title");

  if (!workshopId || !sessionId || !title) {
    redirect(messagePath(workshopId, "Subsession title is required", "error", "schedule"));
  }

  const requestedOrder = field(formData, "display_order");
  const displayOrder = requestedOrder
    ? numberValue(formData, "display_order", 0)
    : await nextSubsessionOrder(sessionId);

  const { error } = await supabase.from("workshop_subsessions").insert({
    session_id: sessionId,
    title,
    description: nullable(formData, "description"),
    start_time: nullable(formData, "start_time"),
    end_time: nullable(formData, "end_time"),
    meeting_url: nullable(formData, "meeting_url"),
    recording_url: nullable(formData, "recording_url"),
    material_url: nullable(formData, "material_url"),
    display_order: displayOrder,
    is_active: checked(formData, "is_active"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Subsession added", "message", "schedule"));
}

export async function updateSubsessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const subsessionId = field(formData, "subsession_id");

  const { error } = await supabase
    .from("workshop_subsessions")
    .update({
      title: field(formData, "title") || "Subsession",
      description: nullable(formData, "description"),
      start_time: nullable(formData, "start_time"),
      end_time: nullable(formData, "end_time"),
      meeting_url: nullable(formData, "meeting_url"),
      recording_url: nullable(formData, "recording_url"),
      material_url: nullable(formData, "material_url"),
      display_order: numberValue(formData, "display_order", 0),
      is_active: checked(formData, "is_active"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subsessionId)
    .eq("session_id", sessionId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Subsession saved", "message", "schedule"));
}

export async function deleteSubsessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const subsessionId = field(formData, "subsession_id");

  const { error } = await supabase
    .from("workshop_subsessions")
    .delete()
    .eq("id", subsessionId)
    .eq("session_id", sessionId);

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  await revalidateWorkshop(workshopId);
  redirect(messagePath(workshopId, "Subsession deleted", "message", "schedule"));
}

export async function moveSubsessionAction(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();
  const workshopId = field(formData, "workshop_id");
  const sessionId = field(formData, "session_id");
  const subsessionId = field(formData, "subsession_id");
  const direction = field(formData, "direction");

  const { data, error } = await supabase
    .from("workshop_subsessions")
    .select("id, display_order, start_time, created_at")
    .eq("session_id", sessionId)
    .order("display_order", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    redirect(messagePath(workshopId, error.message, "error", "schedule"));
  }

  const ordered = [...(data || [])];
  const currentIndex = ordered.findIndex((item) => item.id === subsessionId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= ordered.length
  ) {
    redirect(workshopPath(workshopId, "schedule"));
  }

  [ordered[currentIndex], ordered[targetIndex]] = [
    ordered[targetIndex],
    ordered[currentIndex],
  ];

  for (let index = 0; index < ordered.length; index += 1) {
    const { error: updateError } = await supabase
      .from("workshop_subsessions")
      .update({
        display_order: index + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ordered[index].id);

    if (updateError) {
      redirect(messagePath(workshopId, updateError.message, "error", "schedule"));
    }
  }

  await revalidateWorkshop(workshopId);
  redirect(workshopPath(workshopId, "schedule"));
}
