import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "lexdata_app_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type DurableIdentity = {
  id: string;
  email?: string | null;
  iat: number;
  exp: number;
};

function sessionSecret() {
  const secret =
    process.env.LEXDATA_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing LEXDATA_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

function validSignature(payload: string, received: string) {
  const expected = signature(payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(received);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export async function setDurableAppSession(input: {
  id: string;
  email?: string | null;
}) {
  const now = Math.floor(Date.now() / 1000);

  const identity: DurableIdentity = {
    id: input.id,
    email: input.email || null,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };

  const payload = encode(JSON.stringify(identity));
  const token = `${payload}.${signature(payload)}`;

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getDurableAppSession(): Promise<DurableIdentity | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return null;

    const payload = token.slice(0, separator);
    const receivedSignature = token.slice(separator + 1);

    if (!validSignature(payload, receivedSignature)) {
      return null;
    }

    const identity = JSON.parse(decode(payload)) as DurableIdentity;

    if (!identity?.id || !identity?.exp) {
      return null;
    }

    if (identity.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return identity;
  } catch {
    return null;
  }
}

export async function clearDurableAppSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}