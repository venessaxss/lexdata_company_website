"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export default function LiveRoomClient({
  streamId,
  streamTitle,
  initialStatus,
}: {
  streamId: string;
  streamTitle: string;
  initialStatus: string;
}) {
  const [playerUrl, setPlayerUrl] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [revoked, setRevoked] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamStatus, setStreamStatus] = useState(initialStatus);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const loadToken = useCallback(async () => {
    const response = await fetch(`/api/livestream/${streamId}/token`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok) {
      setPlayerUrl("");
      setPlayerError(payload.error || "Could not load livestream.");
      setRevoked(response.status === 403);
      return;
    }

    setRevoked(false);
    setPlayerError("");
    setPlayerUrl(payload.embedUrl);

    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
    }

    const refreshIn = Math.max(
      60000,
      Number(payload.expiresAt || 0) * 1000 - Date.now() - 60000
    );

    refreshTimer.current = window.setTimeout(() => {
      void loadToken();
    }, refreshIn);
  }, [streamId]);

  const loadAccess = useCallback(async () => {
    const response = await fetch(`/api/livestream/${streamId}/access`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || !payload.allowed) {
      setPlayerUrl("");
      setPlayerError(payload.error || "Livestream access denied.");
      setRevoked(response.status === 403);
      setViewerCount(0);
      return;
    }

    setRevoked(false);
    setViewerCount(Number(payload.viewerCount || 0));
    setStreamStatus(String(payload.status || initialStatus));
  }, [initialStatus, streamId]);

  const loadChat = useCallback(async () => {
    const response = await fetch(`/api/livestream/${streamId}/chat`, {
      cache: "no-store",
    });

    if (!response.ok) return;

    const payload = await response.json();
    setMessages(payload.messages || []);
  }, [streamId]);

  const heartbeat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;

    await fetch(`/api/livestream/${streamId}/heartbeat`, {
      method: "POST",
      keepalive: true,
    });
  }, [streamId]);

  useEffect(() => {
    void loadToken();
    void loadAccess();
    void loadChat();
    void heartbeat();

    const accessTimer = window.setInterval(() => void loadAccess(), 30000);
    const chatTimer = window.setInterval(() => void loadChat(), 3000);
    const heartbeatTimer = window.setInterval(() => void heartbeat(), 45000);

    return () => {
      window.clearInterval(accessTimer);
      window.clearInterval(chatTimer);
      window.clearInterval(heartbeatTimer);

      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, [heartbeat, loadAccess, loadChat, loadToken]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = message.trim();

    if (!body || sending) return;

    setSending(true);

    try {
      const response = await fetch(`/api/livestream/${streamId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json();

      if (!response.ok) {
        window.alert(payload.error || "Could not send message.");
        return;
      }

      setMessage("");
      await loadChat();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              Registered live room
            </p>
            <h2 className="mt-1 font-black">{streamTitle}</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
              {streamStatus}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
              {viewerCount} online
            </span>
          </div>
        </div>

        <div className="aspect-video bg-black">
          {playerUrl && !revoked ? (
            <iframe
              key={playerUrl}
              src={playerUrl}
              title={streamTitle}
              className="h-full w-full border-0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <h3 className="text-2xl font-black text-white">
                  {revoked ? "Access revoked" : "Livestream unavailable"}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">
                  {playerError ||
                    "The broadcast may not have started yet. This page uses your protected workshop access."}
                </p>
                {!revoked ? (
                  <button
                    type="button"
                    onClick={() => void loadToken()}
                    className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                  >
                    Retry player
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Participant chat
          </p>
          <h2 className="mt-1 text-xl font-black">Live discussion</h2>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              No messages yet.
            </p>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">{item.display_name}</p>
                  <time className="text-[11px] font-bold text-slate-400">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.body}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitMessage} className="border-t border-slate-200 p-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            rows={3}
            disabled={revoked}
            placeholder={revoked ? "Chat access revoked" : "Write a message..."}
            className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {message.length}/500
            </span>
            <button
              disabled={revoked || sending || !message.trim()}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
