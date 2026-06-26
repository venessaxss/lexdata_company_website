import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrManager } from "@/lib/require-admin-or-manager";
import {
  createHeroSlide,
  deleteHeroSlide,
  updateHeroSlide,
} from "@/app/admin/hero/actions";

export default async function HeroAdminPanel({
  title = "Homepage Hero Slides",
}: {
  title?: string;
}) {
  await requireAdminOrManager();

  const supabase = createAdminClient();

  const { data: slides } = await supabase
    .from("home_hero_slides")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500">
          Homepage Management
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-2 text-slate-600">
          Upload hero background photos or videos, add multiple slides, and
          control the auto-scrolling homepage banner.
        </p>
      </div>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Add New Slide</h2>

        <form action={createHeroSlide} className="mt-6 grid gap-4">
          <input name="badge" placeholder="Badge, e.g. New Workshop" className="rounded-xl border px-4 py-3" />
          <input name="title" required placeholder="Hero title" className="rounded-xl border px-4 py-3" />
          <textarea name="subtitle" placeholder="Subtitle" rows={3} className="rounded-xl border px-4 py-3" />

          <div className="grid gap-4 md:grid-cols-2">
            <input name="primary_button_text" defaultValue="Join the Course" className="rounded-xl border px-4 py-3" />
            <input name="primary_button_href" defaultValue="/courses" className="rounded-xl border px-4 py-3" />
            <input name="secondary_button_text" defaultValue="Contact LexData" className="rounded-xl border px-4 py-3" />
            <input name="secondary_button_href" defaultValue="/contact" className="rounded-xl border px-4 py-3" />
          </div>

          <select name="media_type" defaultValue="image" className="rounded-xl border px-4 py-3">
            <option value="image">Image background</option>
            <option value="video">Video background</option>
            <option value="recommended">System recommended background</option>
          </select>

          <input name="media_file" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="rounded-xl border px-4 py-3" />
          <input name="media_url" placeholder="Or paste image/video URL" className="rounded-xl border px-4 py-3" />

          <div className="grid gap-4 md:grid-cols-2">
            <input name="overlay_opacity" type="number" step="0.05" min="0" max="1" defaultValue="0.68" className="rounded-xl border px-4 py-3" />
            <input name="display_order" type="number" defaultValue="0" className="rounded-xl border px-4 py-3" />
          </div>

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show this slide</span>
          </label>

          <button type="submit" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">
            Add Slide
          </button>
        </form>
      </section>

      <section className="space-y-6">
        {(slides ?? []).map((slide) => (
          <div key={slide.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <form action={updateHeroSlide} className="grid gap-4">
              <input type="hidden" name="id" value={slide.id} />
              <input type="hidden" name="current_media_url" value={slide.media_url ?? ""} />

              {slide.media_url ? (
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  {slide.media_type === "video" ? (
                    <video src={slide.media_url} className="h-64 w-full object-cover" controls />
                  ) : (
                    <img src={slide.media_url} alt={slide.title} className="h-64 w-full object-cover" />
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
                  System recommended background
                </div>
              )}

              <input name="badge" defaultValue={slide.badge ?? ""} className="rounded-xl border px-4 py-3" />
              <input name="title" required defaultValue={slide.title ?? ""} className="rounded-xl border px-4 py-3" />
              <textarea name="subtitle" defaultValue={slide.subtitle ?? ""} rows={3} className="rounded-xl border px-4 py-3" />

              <div className="grid gap-4 md:grid-cols-2">
                <input name="primary_button_text" defaultValue={slide.primary_button_text ?? ""} className="rounded-xl border px-4 py-3" />
                <input name="primary_button_href" defaultValue={slide.primary_button_href ?? ""} className="rounded-xl border px-4 py-3" />
                <input name="secondary_button_text" defaultValue={slide.secondary_button_text ?? ""} className="rounded-xl border px-4 py-3" />
                <input name="secondary_button_href" defaultValue={slide.secondary_button_href ?? ""} className="rounded-xl border px-4 py-3" />
              </div>

              <select name="media_type" defaultValue={slide.media_type ?? "image"} className="rounded-xl border px-4 py-3">
                <option value="image">Image background</option>
                <option value="video">Video background</option>
                <option value="recommended">System recommended background</option>
              </select>

              <input name="media_file" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="rounded-xl border px-4 py-3" />
              <input name="media_url" defaultValue={slide.media_url ?? ""} className="rounded-xl border px-4 py-3" />

              <div className="grid gap-4 md:grid-cols-2">
                <input name="overlay_opacity" type="number" step="0.05" min="0" max="1" defaultValue={slide.overlay_opacity ?? 0.68} className="rounded-xl border px-4 py-3" />
                <input name="display_order" type="number" defaultValue={slide.display_order ?? 0} className="rounded-xl border px-4 py-3" />
              </div>

              <label className="flex items-center gap-2">
                <input name="is_active" type="checkbox" defaultChecked={slide.is_active} />
                <span>Show this slide</span>
              </label>

              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">
                  Update Slide
                </button>
              </div>
            </form>

            <form action={deleteHeroSlide} className="mt-3">
              <input type="hidden" name="id" value={slide.id} />
              <button type="submit" className="rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 hover:bg-red-50">
                Delete Slide
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}