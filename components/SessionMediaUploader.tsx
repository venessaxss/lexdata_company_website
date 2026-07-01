"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SessionMediaUploader() {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("none");
  const [status, setStatus] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setStatus("Please upload an image or video file.");
      return;
    }

    setStatus(`Uploading ${file.name}...`);

    const supabase = createClient();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from("workshop-session-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      setStatus(`Upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage
      .from("workshop-session-media")
      .getPublicUrl(filePath);

    setMediaUrl(data.publicUrl);
    setMediaType(isVideo ? "video" : "image");
    setStatus("Upload complete");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Session picture or small video
      </label>

      <input
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleUpload}
        className="w-full rounded-xl border bg-white px-4 py-3"
      />

      <input type="hidden" name="session_media_url" value={mediaUrl} />
      <input type="hidden" name="session_media_type" value={mediaType} />

      {status ? <p className="mt-2 text-sm text-slate-600">{status}</p> : null}

      {mediaUrl && mediaType === "image" ? (
        <img
          src={mediaUrl}
          alt="Uploaded session media"
          className="mt-4 h-48 w-full rounded-xl object-cover"
        />
      ) : null}

      {mediaUrl && mediaType === "video" ? (
        <video
          src={mediaUrl}
          controls
          className="mt-4 h-48 w-full rounded-xl object-cover"
        />
      ) : null}

      <p className="mt-3 text-xs text-slate-500">
        For large videos, use the YouTube / Jianying external video link field
        below.
      </p>
    </div>
  );
}