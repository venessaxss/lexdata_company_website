import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type HeroSlide = {
  id: string;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  primary_button_text?: string | null;
  primary_button_href?: string | null;
  secondary_button_text?: string | null;
  secondary_button_href?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  overlay_opacity?: number | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

async function requireAdminOrManager() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["admin", "manager"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  return { user, profile };
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function uploadHeroMedia(file: File | null) {
  if (!file || file.size === 0) return null;

  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() || "bin";
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("home-hero-media")
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("home-hero-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function createHeroSlide(formData: FormData) {
  "use server";

  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/hero";

  const title = field(formData, "title");
  if (!title) {
    redirect(`${returnTo}?message=Title is required`);
  }

  const uploadedUrl = await uploadHeroMedia(
    formData.get("media_file") as File | null
  );

  const manualUrl = field(formData, "media_url");
  const mediaUrl = uploadedUrl || manualUrl || null;

  const { error } = await supabase.from("home_hero_slides").insert({
    badge: field(formData, "badge"),
    title,
    subtitle: field(formData, "subtitle"),
    primary_button_text: field(formData, "primary_button_text"),
    primary_button_href: field(formData, "primary_button_href"),
    secondary_button_text: field(formData, "secondary_button_text"),
    secondary_button_href: field(formData, "secondary_button_href"),
    media_type: field(formData, "media_type") || "image",
    media_url: mediaUrl,
    overlay_opacity: Number(field(formData, "overlay_opacity") || 0.68),
    display_order: Number(field(formData, "display_order") || 0),
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect(`${returnTo}?message=Hero slide created`);
}

async function updateHeroSlide(formData: FormData) {
  "use server";

  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/hero";

  const id = field(formData, "id");
  const title = field(formData, "title");

  if (!id || !title) {
    redirect(`${returnTo}?message=Missing slide ID or title`);
  }

  const currentMediaUrl = field(formData, "current_media_url");

  const uploadedUrl = await uploadHeroMedia(
    formData.get("media_file") as File | null
  );

  const manualUrl = field(formData, "media_url");
  const finalMediaUrl = uploadedUrl || manualUrl || currentMediaUrl || null;

  const { error } = await supabase
    .from("home_hero_slides")
    .update({
      badge: field(formData, "badge"),
      title,
      subtitle: field(formData, "subtitle"),
      primary_button_text: field(formData, "primary_button_text"),
      primary_button_href: field(formData, "primary_button_href"),
      secondary_button_text: field(formData, "secondary_button_text"),
      secondary_button_href: field(formData, "secondary_button_href"),
      media_type: field(formData, "media_type") || "image",
      media_url: finalMediaUrl,
      overlay_opacity: Number(field(formData, "overlay_opacity") || 0.68),
      display_order: Number(field(formData, "display_order") || 0),
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect(`${returnTo}?message=Hero slide updated`);
}

async function deleteHeroSlide(formData: FormData) {
  "use server";

  await requireAdminOrManager();

  const supabase = createAdminClient();
  const returnTo = field(formData, "return_to") || "/admin/hero";
  const id = field(formData, "id");

  const { error } = await supabase
    .from("home_hero_slides")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`${returnTo}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath("/manager/hero");

  redirect(`${returnTo}?message=Hero slide deleted`);
}

export default async function HeroAdminPanel({
  title = "Homepage Hero Slides",
  returnTo = "/admin/hero",
}: {
  title?: string;
  returnTo?: string;
}) {
  await requireAdminOrManager();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("home_hero_slides")
    .select("*")
    .order("display_order", { ascending: true });

  const slides = (data ?? []) as HeroSlide[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500">
          Homepage Management
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {title}
        </h1>

        <p className="mt-2 text-slate-600">
          Upload homepage background photos or videos, create multiple slides,
          and control the auto-scrolling hero banner.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          Add New Hero Slide
        </h2>

        <form
          action={createHeroSlide}
          encType="multipart/form-data"
          className="mt-6 grid gap-4"
        >
          <input type="hidden" name="return_to" value={returnTo} />

          <input
            name="badge"
            placeholder="Badge, e.g. New Workshop"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="title"
            required
            placeholder="Hero title"
            className="rounded-xl border px-4 py-3"
          />

          <textarea
            name="subtitle"
            placeholder="Subtitle"
            rows={3}
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="primary_button_text"
              defaultValue="Join the Course"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="primary_button_href"
              defaultValue="/courses"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="secondary_button_text"
              defaultValue="Contact LexData"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="secondary_button_href"
              defaultValue="/contact"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <select
            name="media_type"
            defaultValue="image"
            className="rounded-xl border px-4 py-3"
          >
            <option value="image">Image background</option>
            <option value="video">Video background</option>
            <option value="recommended">System recommended background</option>
          </select>

          <input
            name="media_file"
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="media_url"
            placeholder="Or paste image/video URL"
            className="rounded-xl border px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="overlay_opacity"
              type="number"
              step="0.05"
              min="0"
              max="1"
              defaultValue="0.68"
              className="rounded-xl border px-4 py-3"
            />

            <input
              name="display_order"
              type="number"
              defaultValue="0"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show this slide</span>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Add Slide
          </button>
        </form>
      </section>

      <section className="space-y-6">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {slide.media_url ? (
              <div className="mb-5 overflow-hidden rounded-2xl bg-slate-100">
                {slide.media_type === "video" ? (
                  <video
                    src={slide.media_url}
                    className="h-64 w-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={slide.media_url}
                    alt={slide.title ?? "Hero slide"}
                    className="h-64 w-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="mb-5 flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
                System recommended background
              </div>
            )}

            <form
              action={updateHeroSlide}
              encType="multipart/form-data"
              className="grid gap-4"
            >
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={slide.id} />
              <input
                type="hidden"
                name="current_media_url"
                value={slide.media_url ?? ""}
              />

              <input
                name="badge"
                defaultValue={slide.badge ?? ""}
                className="rounded-xl border px-4 py-3"
              />

              <input
                name="title"
                required
                defaultValue={slide.title ?? ""}
                className="rounded-xl border px-4 py-3"
              />

              <textarea
                name="subtitle"
                defaultValue={slide.subtitle ?? ""}
                rows={3}
                className="rounded-xl border px-4 py-3"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="primary_button_text"
                  defaultValue={slide.primary_button_text ?? ""}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="primary_button_href"
                  defaultValue={slide.primary_button_href ?? ""}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="secondary_button_text"
                  defaultValue={slide.secondary_button_text ?? ""}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="secondary_button_href"
                  defaultValue={slide.secondary_button_href ?? ""}
                  className="rounded-xl border px-4 py-3"
                />
              </div>

              <select
                name="media_type"
                defaultValue={slide.media_type ?? "image"}
                className="rounded-xl border px-4 py-3"
              >
                <option value="image">Image background</option>
                <option value="video">Video background</option>
                <option value="recommended">
                  System recommended background
                </option>
              </select>

              <input
                name="media_file"
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                className="rounded-xl border px-4 py-3"
              />

              <input
                name="media_url"
                defaultValue={slide.media_url ?? ""}
                placeholder="Or paste image/video URL"
                className="rounded-xl border px-4 py-3"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="overlay_opacity"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  defaultValue={slide.overlay_opacity ?? 0.68}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  name="display_order"
                  type="number"
                  defaultValue={slide.display_order ?? 0}
                  className="rounded-xl border px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={Boolean(slide.is_active)}
                />
                <span>Show this slide</span>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
              >
                Update Slide
              </button>
            </form>

            <form action={deleteHeroSlide} className="mt-3">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="id" value={slide.id} />

              <button
                type="submit"
                className="rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 hover:bg-red-50"
              >
                Delete Slide
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
