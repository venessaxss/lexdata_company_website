type Envelope<T> = {
  result: T;
  success: boolean;
  errors?: Array<{ message?: string }>;
};

function required(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function customerCode(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/^customer-/, "")
    .replace(/\.cloudflarestream\.com.*$/, "")
    .replace(/\/.*$/, "")
    .trim();
}

export function streamConfig() {
  const requestedTtl = Number(process.env.LIVESTREAM_TOKEN_TTL_SECONDS || 7200);

  return {
    accountId: required("CLOUDFLARE_ACCOUNT_ID"),
    apiToken: required("CLOUDFLARE_STREAM_API_TOKEN"),
    customerCode: customerCode(required("CLOUDFLARE_STREAM_CUSTOMER_CODE")),
    allowedOrigins: String(process.env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    tokenTtlSeconds: Number.isFinite(requestedTtl)
      ? Math.max(300, Math.min(86400, Math.floor(requestedTtl)))
      : 7200,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const config = streamConfig();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    }
  );

  const envelope = (await response.json()) as Envelope<T>;

  if (!response.ok || !envelope.success) {
    const message =
      envelope.errors?.map((item) => item.message).filter(Boolean).join("; ") ||
      `Cloudflare request failed with status ${response.status}`;

    throw new Error(message);
  }

  return envelope.result;
}

export type LiveInput = {
  uid: string;
  enabled?: boolean;
  rtmps?: {
    url?: string;
    streamKey?: string;
  };
};

export async function createLiveInput(name: string) {
  const config = streamConfig();

  return request<LiveInput>("/stream/live_inputs", {
    method: "POST",
    body: JSON.stringify({
      meta: { name },
      enabled: true,
      recording: {
        mode: "automatic",
        requireSignedURLs: true,
        allowedOrigins: config.allowedOrigins,
        hideLiveViewerCount: false,
        timeoutSeconds: 0,
      },
    }),
  });
}

export async function setLiveInputEnabled(
  liveInputUid: string,
  enabled: boolean
) {
  return request<LiveInput>(
    `/stream/live_inputs/${encodeURIComponent(liveInputUid)}`,
    {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    }
  );
}

export type StreamVideo = {
  uid: string;
  created?: string;
  readyToStream?: boolean;
  status?: { state?: string };
};

export async function listLiveInputVideos(liveInputUid: string) {
  return request<StreamVideo[]>(
    `/stream/live_inputs/${encodeURIComponent(liveInputUid)}/videos`,
    { method: "GET" }
  );
}

export async function createPlaybackToken(identifier: string) {
  const config = streamConfig();
  const expiresAt = Math.floor(Date.now() / 1000) + config.tokenTtlSeconds;

  const result = await request<{ token: string }>(
    `/stream/${encodeURIComponent(identifier)}/token`,
    {
      method: "POST",
      body: JSON.stringify({ exp: expiresAt }),
    }
  );

  if (!result?.token) {
    throw new Error("Cloudflare did not return a playback token.");
  }

  return {
    token: result.token,
    expiresAt,
    embedUrl:
      `https://customer-${config.customerCode}.cloudflarestream.com/` +
      `${result.token}/iframe?autoplay=true`,
  };
}
