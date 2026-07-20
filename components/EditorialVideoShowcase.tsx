"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditorialVideoItem } from "@/content/editorialVideos";

function youtubeEmbedUrl(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.replace("/", "")}`;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return src;
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return src;
  }
  return src;
}

export default function EditorialVideoShowcase({ videos }: { videos: EditorialVideoItem[] }) {
  const visibleVideos = useMemo(() => videos.filter(Boolean), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const safeIndex = visibleVideos.length ? activeIndex % visibleVideos.length : 0;
  const active = visibleVideos[safeIndex];
  const previous = visibleVideos.length > 1
    ? visibleVideos[(safeIndex - 1 + visibleVideos.length) % visibleVideos.length]
    : null;
  const next = visibleVideos.length > 1
    ? visibleVideos[(safeIndex + 1) % visibleVideos.length]
    : null;

  useEffect(() => {
    setPlaying(false);
  }, [safeIndex]);

  if (!active) return null;

  const canPlay = Boolean(active.src);
  const posterStyle = active.poster ? { backgroundImage: `url(${active.poster})` } : undefined;

  const goPrevious = () => {
    if (visibleVideos.length < 2) return;
    setActiveIndex((current) => (current - 1 + visibleVideos.length) % visibleVideos.length);
  };

  const goNext = () => {
    if (visibleVideos.length < 2) return;
    setActiveIndex((current) => (current + 1) % visibleVideos.length);
  };

  return (
    <div className="lx-editorial-video">
      <div className="lx-editorial-video-copy">
        <p>{active.eyebrow}</p>
        <h3>{active.title}</h3>
        {active.description ? <span>{active.description}</span> : null}
      </div>

      <div className="lx-video-carousel-stage">
        <button type="button" className="lx-video-arrow lx-video-arrow-left" onClick={goPrevious} disabled={!previous} aria-label="Previous video">
          <span />
        </button>

        <div
          className={`lx-video-side-card lx-video-side-left ${previous?.poster ? "has-poster" : ""}`}
          style={previous?.poster ? { backgroundImage: `url(${previous.poster})` } : undefined}
          aria-hidden="true"
        />

        <div className={`lx-video-frame ${active.poster ? "has-poster" : "no-poster"}`} style={posterStyle}>
          {playing && canPlay ? (
            active.kind === "youtube" ? (
              <iframe
                src={`${youtubeEmbedUrl(active.src || "")}?autoplay=1&rel=0`}
                title={active.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={active.src} controls autoPlay playsInline />
            )
          ) : (
            <>
              <div className="lx-video-paper-preview" aria-hidden="true">
                <div className="lx-video-paper-sheet">
                  <b>Research note</b>
                  <i /><i /><i /><i /><i />
                </div>
                <div className="lx-video-paper-float lx-video-paper-float-one">Draft</div>
                <div className="lx-video-paper-float lx-video-paper-float-two">Review</div>
              </div>
              <button
                type="button"
                className="lx-video-play"
                onClick={() => canPlay && setPlaying(true)}
                aria-label={canPlay ? `Play ${active.title}` : "Add a video URL to enable playback"}
                title={canPlay ? `Play ${active.title}` : "Add src in content/editorialVideos.ts"}
              >
                <span />
              </button>
            </>
          )}
        </div>

        <div
          className={`lx-video-side-card lx-video-side-right ${next?.poster ? "has-poster" : ""}`}
          style={next?.poster ? { backgroundImage: `url(${next.poster})` } : undefined}
          aria-hidden="true"
        />

        <button type="button" className="lx-video-arrow lx-video-arrow-right" onClick={goNext} disabled={!next} aria-label="Next video">
          <span />
        </button>
      </div>

      <div className="lx-video-caption">{active.title.toUpperCase()}</div>

      {visibleVideos.length > 1 ? (
        <div className="lx-video-picker" aria-label="Choose video">
          {visibleVideos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              className={index === safeIndex ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
            >
              <small>{video.eyebrow}</small>
              <strong>{video.title}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}