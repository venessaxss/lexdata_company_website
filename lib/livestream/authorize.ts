import { getCurrentProfile, normalizeRole } from "@/lib/auth";
import { canAccessWorkshop } from "@/lib/access-control";

type Denied = {
  ok: false;
  status: 401 | 403 | 404;
  error: string;
};

type Granted = {
  ok: true;
  identity: any;
  stream: any;
  workshop: any;
  registration: any | null;
};

export type LiveAccess = Denied | Granted;

async function findRegistration(input: {
  admin: any;
  workshopId: string;
  userId: string;
  email?: string | null;
}) {
  const byUser = await input.admin
    .from("workshop_registrations")
    .select("*")
    .eq("workshop_id", input.workshopId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (byUser.data) return byUser.data;

  if (input.email) {
    const byEmail = await input.admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", input.workshopId)
      .ilike("email", input.email)
      .maybeSingle();

    if (byEmail.data) return byEmail.data;
  }

  return null;
}

export async function authorizeLiveViewer(
  streamId: string
): Promise<LiveAccess> {
  const identity = await getCurrentProfile();

  if (!identity) {
    return { ok: false, status: 401, error: "Login required." };
  }

  const { data: stream, error } = await identity.admin
    .from("workshop_live_streams")
    .select(
      `
      *,
      workshops:workshop_id (
        id,
        title,
        slug
      )
    `
    )
    .eq("id", streamId)
    .maybeSingle();

  if (error || !stream) {
    return {
      ok: false,
      status: 404,
      error: error?.message || "Livestream not found.",
    };
  }

  const workshop = Array.isArray(stream.workshops)
    ? stream.workshops[0]
    : stream.workshops;

  if (!workshop?.id) {
    return { ok: false, status: 404, error: "Workshop not found." };
  }

  const role = normalizeRole(identity.role);

  if (role === "admin" || role === "manager") {
    return { ok: true, identity, stream, workshop, registration: null };
  }

  const registration = await findRegistration({
    admin: identity.admin,
    workshopId: workshop.id,
    userId: identity.id,
    email: identity.email,
  });

  if (!canAccessWorkshop(registration)) {
    return {
      ok: false,
      status: 403,
      error: "Your workshop livestream access is locked or revoked.",
    };
  }

  return { ok: true, identity, stream, workshop, registration };
}

export function playbackIdentifier(stream: any) {
  if (stream.status === "ended" && stream.recording_uid) {
    return stream.recording_uid;
  }

  return stream.live_input_uid;
}
