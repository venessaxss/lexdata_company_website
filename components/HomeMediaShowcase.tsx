"use client";

import { useMemo, useState } from "react";
import {
  deleteHomepageVideoAction,
  saveHomepageVideoAction,
} from "@/app/homepage-media/actions";

export type HomepageVideo = {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  youtube_url: string;
  tag?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type HomeMediaShowcaseProps = {
  videos: HomepageVideo[];
  canManage?: boolean;
};

function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;

      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    return "";
  } catch {
    return "";
  }
}

const fallbackVideos: HomepageVideo[] = [
  {
    id: "fallback-1",
    title: "LexData Training Spotlight",
    title_ar: "لمحة عن تدريب LexData",
    description:
      "Explore LexData training, NLP workshops, AI learning, and institutional collaboration.",
    description_ar:
      "تعرف على تدريبات LexData وورش معالجة اللغة الطبيعية والتعلم بالذكاء الاصطناعي والتعاون المؤسسي.",
    youtube_url: "",
    tag: "Featured",
    display_order: 0,
    is_active: true,
  },
];

export default function HomeMediaShowcase({
  videos,
  canManage = false,
}: HomeMediaShowcaseProps) {
  const visibleVideos = videos.length > 0 ? videos : fallbackVideos;
  const [activeIndex, setActiveIndex] = useState(0);

  const activeVideo = visibleVideos[activeIndex] || visibleVideos[0];

  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(activeVideo.youtube_url),
    [activeVideo.youtube_url]
  );

  return (
    <section className="bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-300">
              Dynamic Video Showcase
            </p>

            <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Watch LexData in action.
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Explore NLP training, AI research support, workshops, and
              collaboration programs through selected YouTube videos.
            </p>
          </div>

          <div dir="rtl" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
              مكتبة الفيديو
            </p>

            <h3 className="mt-4 text-3xl font-black leading-tight">
              شاهد LexData عملياً.
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              تعرف على تدريبات معالجة اللغة الطبيعية والذكاء الاصطناعي وورش
              العمل والتعاون المؤسسي من خلال مقاطع مختارة.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={activeVideo.title}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-slate-900 p-8 text-center text-sm font-bold text-slate-400">
                Add a YouTube link from the homepage editor.
              </div>
            )}

            <div className="p-6">
              <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black text-white">
                {activeVideo.tag || "Featured"}
              </span>

              <h3 className="mt-4 text-2xl font-black">{activeVideo.title}</h3>

              {activeVideo.description ? (
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {activeVideo.description}
                </p>
              ) : null}

              {(activeVideo.title_ar || activeVideo.description_ar) ? (
                <div dir="rtl" className="mt-5 border-t border-white/10 pt-5">
                  {activeVideo.title_ar ? (
                    <h4 className="text-xl font-black text-blue-200">
                      {activeVideo.title_ar}
                    </h4>
                  ) : null}

                  {activeVideo.description_ar ? (
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {activeVideo.description_ar}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            {visibleVideos.map((video, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    isActive
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
                    {video.tag || "Featured"}
                  </p>

                  <h4 className="mt-2 text-lg font-black">{video.title}</h4>

                  {video.description ? (
                    <p className="mt-2 text-sm leading-6 opacity-80">
                      {video.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {canManage ? (
          <div className="mt-10 rounded-[2rem] border border-blue-400/30 bg-blue-950/40 p-6">
            <h3 className="text-2xl font-black">Homepage video manager</h3>

            <p className="mt-2 text-sm text-blue-100">
              Admins and managers can add, edit, hide, or delete homepage
              YouTube videos directly from here.
            </p>

            <form
              action={saveHomepageVideoAction}
              className="mt-6 grid gap-3 rounded-3xl bg-white p-5 text-slate-950"
            >
              <h4 className="text-lg font-black">Add new video</h4>

              <input
                name="title"
                placeholder="English title"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                required
              />

              <input
                name="title_ar"
                placeholder="Arabic title"
                dir="rtl"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <input
                name="youtube_url"
                placeholder="YouTube link"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                required
              />

              <input
                name="tag"
                placeholder="Tag, e.g. NLP / Workshop / Featured"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <input
                name="display_order"
                type="number"
                placeholder="Display order"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <textarea
                name="description"
                placeholder="English description"
                className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <textarea
                name="description_ar"
                placeholder="Arabic description"
                dir="rtl"
                className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              />

              <label className="flex items-center gap-2 text-sm font-black">
                <input name="is_active" type="checkbox" defaultChecked />
                Active
              </label>

              <button
                type="submit"
                className="rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-800"
              >
                Add video
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {videos.map((video) => (
                <form
                  key={video.id}
                  action={saveHomepageVideoAction}
                  className="grid gap-3 rounded-3xl bg-white p-5 text-slate-950"
                >
                  <input type="hidden" name="id" value={video.id} />

                  <input
                    name="title"
                    defaultValue={video.title}
                    className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                    required
                  />

                  <input
                    name="title_ar"
                    defaultValue={video.title_ar || ""}
                    dir="rtl"
                    className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                  />

                  <input
                    name="youtube_url"
                    defaultValue={video.youtube_url}
                    className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                    required
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      name="tag"
                      defaultValue={video.tag || ""}
                      className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                    />

                    <input
                      name="display_order"
                      type="number"
                      defaultValue={video.display_order || 0}
                      className="rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                    />
                  </div>

                  <textarea
                    name="description"
                    defaultValue={video.description || ""}
                    className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                  />

                  <textarea
                    name="description_ar"
                    defaultValue={video.description_ar || ""}
                    dir="rtl"
                    className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                  />

                  <label className="flex items-center gap-2 text-sm font-black">
                    <input
                      name="is_active"
                      type="checkbox"
                      defaultChecked={video.is_active !== false}
                    />
                    Active
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="submit"
                      className="rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white hover:bg-emerald-800"
                    >
                      Save changes
                    </button>

                    <button
                      formAction={deleteHomepageVideoAction}
                      className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-700"
                    >
                      Delete video
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}