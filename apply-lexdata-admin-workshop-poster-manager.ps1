$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$parent = Split-Path $root -Parent
$backupRoot = Join-Path $parent ("lexdata_admin_workshop_posters_backup_" + $stamp)

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Backup-File([string]$RelativePath) {
    $src = Join-Path $root $RelativePath
    if (Test-Path $src) {
        $dst = Join-Path $backupRoot $RelativePath
        $dir = Split-Path $dst -Parent
        if ($dir) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
    }
}

function Write-Utf8([string]$Path, [string]$Content) {
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

if (!(Test-Path (Join-Path $root "package.json"))) {
    throw "Run this script from the LexData Next.js project root."
}

Write-Host "LexData Admin Workshop Poster Manager" -ForegroundColor Cyan
Write-Host "Project: $root"
Write-Host "Backup:  $backupRoot"
Write-Host ""

$filesToBackup = @(
    "components\IntegratedHomePage.tsx",
    "content\workshopNotices.ts",
    "app\admin\page.tsx",
    "lib\workshop-notices.ts",
    "app\admin\workshop-notices\page.tsx",
    "app\admin\workshop-notices\actions.ts",
    "supabase\migrations\20260720_workshop_notices.sql",
    "WORKSHOP-NOTICES-SETUP.sql"
)

foreach ($item in $filesToBackup) {
    Backup-File $item
}

# -------------------------------------------------------------------
# 1. Database + Storage migration
# -------------------------------------------------------------------

$sql = @'
-- LexData Workshop Notice / Poster Manager
-- Run once in Supabase SQL Editor, or apply with your normal migration workflow.

create extension if not exists pgcrypto;

create table if not exists public.workshop_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  date_label text not null default '',
  venue text not null default '',
  poster_url text,
  poster_path text,
  href text,
  badge text not null default 'WORKSHOP',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshop_notices enable row level security;

-- No public table policies are required.
-- The homepage and admin tools access this table on the server through
-- the service-role client.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'workshop-posters',
  'workshop-posters',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Seed the three current placeholder notices only when the table is empty.
insert into public.workshop_notices
  (title, summary, date_label, venue, badge, sort_order, is_published)
select *
from (
  values
    (
      'Upcoming LexData workshop',
      'Add the workshop title, schedule, venue, registration link, and poster here.',
      'Coming soon',
      'LexData',
      'NEW WORKSHOP',
      10,
      true
    ),
    (
      'Research methods training',
      'Use this card for a new training session, seminar, or academic workshop notice.',
      'Coming soon',
      'Online or on site',
      'NOTICE',
      20,
      true
    ),
    (
      'Language and AI workshop',
      'Upload and manage this poster directly from the LexData admin control panel.',
      'Coming soon',
      'LexData',
      'UPCOMING',
      30,
      true
    )
) as seed(title, summary, date_label, venue, badge, sort_order, is_published)
where not exists (
  select 1 from public.workshop_notices
);
'@

Write-Utf8 (Join-Path $root "supabase\migrations\20260720_workshop_notices.sql") $sql
Write-Utf8 (Join-Path $root "WORKSHOP-NOTICES-SETUP.sql") $sql

# -------------------------------------------------------------------
# 2. Keep the existing public type and static fallback notices
# -------------------------------------------------------------------

$noticeTypes = @'
export type WorkshopNotice = {
  id: string;
  title: string;
  summary: string;
  date: string;
  venue: string;
  poster?: string;
  href?: string;
  badge?: string;
};

export const workshopNotices: WorkshopNotice[] = [
  {
    id: "workshop-01",
    title: "Upcoming LexData workshop",
    summary:
      "Add the workshop title, schedule, venue, registration link, and poster here.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "NEW WORKSHOP",
  },
  {
    id: "workshop-02",
    title: "Research methods training",
    summary:
      "Use this card for a new training session, seminar, or academic workshop notice.",
    date: "Coming soon",
    venue: "Online or on site",
    poster: "",
    href: "",
    badge: "NOTICE",
  },
  {
    id: "workshop-03",
    title: "Language and AI workshop",
    summary:
      "Upload and manage this poster directly from the LexData admin control panel.",
    date: "Coming soon",
    venue: "LexData",
    poster: "",
    href: "",
    badge: "UPCOMING",
  },
];
'@

Write-Utf8 (Join-Path $root "content\workshopNotices.ts") $noticeTypes

# -------------------------------------------------------------------
# 3. Server-side homepage loader with static fallback
# -------------------------------------------------------------------

$loaderTs = @'
import { createAdminClient } from "@/lib/supabase/admin";
import {
  workshopNotices as fallbackWorkshopNotices,
  type WorkshopNotice,
} from "@/content/workshopNotices";

type WorkshopNoticeRow = {
  id: string;
  title: string;
  summary: string | null;
  date_label: string | null;
  venue: string | null;
  poster_url: string | null;
  href: string | null;
  badge: string | null;
  sort_order: number | null;
};

export async function getPublicWorkshopNotices(): Promise<WorkshopNotice[]> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("workshop_notices")
      .select(
        "id, title, summary, date_label, venue, poster_url, href, badge, sort_order"
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Workshop notice load failed:", error.message);
      return fallbackWorkshopNotices;
    }

    if (!data || data.length === 0) {
      return fallbackWorkshopNotices;
    }

    return (data as WorkshopNoticeRow[]).map((notice) => ({
      id: notice.id,
      title: notice.title,
      summary: notice.summary || "",
      date: notice.date_label || "",
      venue: notice.venue || "",
      poster: notice.poster_url || "",
      href: notice.href || "",
      badge: notice.badge || "WORKSHOP",
    }));
  } catch (error) {
    console.error("Workshop notice load failed:", error);
    return fallbackWorkshopNotices;
  }
}
'@

Write-Utf8 (Join-Path $root "lib\workshop-notices.ts") $loaderTs

# -------------------------------------------------------------------
# 4. Admin actions
# -------------------------------------------------------------------

$actionsTs = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const BUCKET = "workshop-posters";
const MAX_POSTER_BYTES = 10 * 1024 * 1024;
const ALLOWED_POSTER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function integer(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function adminReturn(
  key: "message" | "error",
  message: string
) {
  redirect(
    `/admin/workshop-notices?${key}=${encodeURIComponent(message)}`
  );
}

function safeFileName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "poster"}.${ext}`;
}

async function uploadPoster(
  admin: any,
  noticeId: string,
  file: File
) {
  if (!ALLOWED_POSTER_TYPES.has(file.type)) {
    throw new Error("Poster must be JPG, PNG, or WEBP.");
  }

  if (file.size > MAX_POSTER_BYTES) {
    throw new Error("Poster must be 10 MB or smaller.");
  }

  const path = `${noticeId}/${Date.now()}-${safeFileName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

  return {
    posterPath: path,
    posterUrl: data.publicUrl,
  };
}

export async function saveWorkshopNoticeAction(formData: FormData) {
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;

  const id = text(formData, "id");
  const title = text(formData, "title");
  const summary = text(formData, "summary");
  const dateLabel = text(formData, "date_label");
  const venue = text(formData, "venue");
  const href = text(formData, "href");
  const badge = text(formData, "badge") || "WORKSHOP";
  const sortOrder = integer(formData, "sort_order", 0);
  const isPublished = checked(formData, "is_published");
  const poster = formData.get("poster");

  if (!title) {
    adminReturn("error", "Workshop notice title is required.");
  }

  try {
    let noticeId = id;
    let existingPosterPath: string | null = null;

    if (noticeId) {
      const { data: existing, error: existingError } = await admin
        .from("workshop_notices")
        .select("id, poster_path")
        .eq("id", noticeId)
        .maybeSingle();

      if (existingError) {
        adminReturn("error", existingError.message);
      }

      existingPosterPath = existing?.poster_path || null;

      const { error: updateError } = await admin
        .from("workshop_notices")
        .update({
          title,
          summary,
          date_label: dateLabel,
          venue,
          href: href || null,
          badge,
          sort_order: sortOrder,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noticeId);

      if (updateError) {
        adminReturn("error", updateError.message);
      }
    } else {
      const { data: created, error: createError } = await admin
        .from("workshop_notices")
        .insert({
          title,
          summary,
          date_label: dateLabel,
          venue,
          href: href || null,
          badge,
          sort_order: sortOrder,
          is_published: isPublished,
        })
        .select("id")
        .single();

      if (createError || !created?.id) {
        adminReturn(
          "error",
          createError?.message || "Could not create workshop notice."
        );
      }

      noticeId = created.id;
    }

    if (poster instanceof File && poster.size > 0) {
      const uploaded = await uploadPoster(admin, noticeId, poster);

      const { error: posterUpdateError } = await admin
        .from("workshop_notices")
        .update({
          poster_url: uploaded.posterUrl,
          poster_path: uploaded.posterPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noticeId);

      if (posterUpdateError) {
        await admin.storage.from(BUCKET).remove([uploaded.posterPath]);
        adminReturn("error", posterUpdateError.message);
      }

      if (existingPosterPath && existingPosterPath !== uploaded.posterPath) {
        await admin.storage.from(BUCKET).remove([existingPosterPath]);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/workshop-notices");

    adminReturn(
      "message",
      id ? "Workshop poster updated." : "Workshop poster created."
    );
  } catch (error) {
    adminReturn(
      "error",
      error instanceof Error ? error.message : "Could not save workshop poster."
    );
  }
}

export async function deleteWorkshopNoticeAction(formData: FormData) {
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;
  const id = text(formData, "id");

  if (!id) {
    adminReturn("error", "Missing workshop notice ID.");
  }

  const { data: existing, error: loadError } = await admin
    .from("workshop_notices")
    .select("poster_path")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    adminReturn("error", loadError.message);
  }

  const { error: deleteError } = await admin
    .from("workshop_notices")
    .delete()
    .eq("id", id);

  if (deleteError) {
    adminReturn("error", deleteError.message);
  }

  if (existing?.poster_path) {
    await admin.storage.from(BUCKET).remove([existing.poster_path]);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workshop-notices");

  adminReturn("message", "Workshop poster deleted.");
}
'@

Write-Utf8 (Join-Path $root "app\admin\workshop-notices\actions.ts") $actionsTs

# -------------------------------------------------------------------
# 5. Admin page
# -------------------------------------------------------------------

$adminPageTsx = @'
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  deleteWorkshopNoticeAction,
  saveWorkshopNoticeAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  message?: string;
  error?: string;
};

type NoticeRow = {
  id: string;
  title: string;
  summary: string | null;
  date_label: string | null;
  venue: string | null;
  poster_url: string | null;
  href: string | null;
  badge: string | null;
  sort_order: number | null;
  is_published: boolean | null;
};

function NoticeFields({
  notice,
}: {
  notice?: Partial<NoticeRow>;
}) {
  return (
    <>
      {notice?.id ? <input type="hidden" name="id" value={notice.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Title
          <input
            name="title"
            required
            defaultValue={notice?.title || ""}
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Badge
          <input
            name="badge"
            defaultValue={notice?.badge || "WORKSHOP"}
            placeholder="NEW WORKSHOP"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Date label
          <input
            name="date_label"
            defaultValue={notice?.date_label || ""}
            placeholder="July 28, 2026"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Venue
          <input
            name="venue"
            defaultValue={notice?.venue || ""}
            placeholder="Online / Shanghai / LexData"
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
          Registration or details link
          <input
            name="href"
            defaultValue={notice?.href || ""}
            placeholder="/workshops/example or https://..."
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Display order
          <input
            name="sort_order"
            type="number"
            defaultValue={notice?.sort_order ?? 0}
            className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Poster image
          <input
            name="poster"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="rounded-xl border border-dashed border-slate-400 bg-slate-50 px-4 py-3 font-normal"
          />
          <span className="text-xs font-normal text-slate-500">
            JPG, PNG, or WEBP. Maximum 10 MB. Leave empty to keep the current poster.
          </span>
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        Summary
        <textarea
          name="summary"
          rows={4}
          defaultValue={notice?.summary || ""}
          className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={notice?.is_published ?? true}
          className="h-5 w-5"
        />
        Show this poster on the homepage
      </label>
    </>
  );
}

export default async function WorkshopNoticeAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const auth = await requireAdmin("/admin/workshop-notices");
  const admin = auth.admin;

  const { data, error } = await admin
    .from("workshop_notices")
    .select(
      "id, title, summary, date_label, venue, poster_url, href, badge, sort_order, is_published"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const notices = (data || []) as NoticeRow[];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
              Admin control panel
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Workshop posters
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Upload, edit, publish, reorder, and remove the workshop posters
              shown in the homepage slider.
            </p>
          </div>

          <Link
            href="/admin"
            prefetch={false}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
            {params.message}
          </div>
        ) : null}

        {params.error || error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {params.error || error?.message}
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Add new
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Create a homepage workshop poster
          </h2>

          <form action={saveWorkshopNoticeAction} className="mt-6">
            <NoticeFields />
            <button
              type="submit"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-black text-white"
            >
              Create poster
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[320px_1fr]"
            >
              <div className="relative min-h-[360px] bg-slate-200">
                {notice.poster_url ? (
                  <Image
                    src={notice.poster_url}
                    alt={`${notice.title} poster`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full min-h-[360px] place-items-center p-8 text-center text-slate-500">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">
                        No poster uploaded
                      </p>
                      <p className="mt-3 font-serif text-3xl text-slate-800">
                        {notice.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <form action={saveWorkshopNoticeAction}>
                  <NoticeFields notice={notice} />

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
                    >
                      Save changes
                    </button>
                  </div>
                </form>

                <form action={deleteWorkshopNoticeAction} className="mt-3">
                  <input type="hidden" name="id" value={notice.id} />
                  <button
                    type="submit"
                    className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
                  >
                    Delete poster
                  </button>
                </form>
              </div>
            </article>
          ))}

          {!error && notices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
              No workshop posters yet. Create the first one above.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
'@

Write-Utf8 (Join-Path $root "app\admin\workshop-notices\page.tsx") $adminPageTsx

# -------------------------------------------------------------------
# 6. Change homepage to use database-managed notices
# -------------------------------------------------------------------

$homePath = Join-Path $root "components\IntegratedHomePage.tsx"
if (!(Test-Path $homePath)) {
    throw "components\IntegratedHomePage.tsx was not found."
}

$homePageContent = [System.IO.File]::ReadAllText($homePath)

$homePageContent = [regex]::Replace(
    $homePageContent,
    'import\s+\{\s*workshopNotices\s*\}\s+from\s+["'']@/content/workshopNotices["''];?\r?\n',
    ''
)

if ($homePageContent -notmatch 'getPublicWorkshopNotices') {
    $homePageContent = $homePageContent.Replace(
        'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";',
        'import WorkshopNoticeSlider from "@/components/WorkshopNoticeSlider";' + "`r`n" +
        'import { getPublicWorkshopNotices } from "@/lib/workshop-notices";'
    )
}

if ($homePageContent -notmatch 'const workshopNotices = await getPublicWorkshopNotices\(\);') {
    $homePageContent = $homePageContent.Replace(
        'export default async function IntegratedHomePage() {' + "`r`n",
        'export default async function IntegratedHomePage() {' + "`r`n" +
        '  const workshopNotices = await getPublicWorkshopNotices();' + "`r`n"
    )
}

Write-Utf8 $homePath $homePageContent

# -------------------------------------------------------------------
# 7. Add Workshop Posters card to Admin dashboard
# -------------------------------------------------------------------

$adminDashboardPath = Join-Path $root "app\admin\page.tsx"

if (Test-Path $adminDashboardPath) {
    $adminDashboardContent = [System.IO.File]::ReadAllText($adminDashboardPath)

    if ($adminDashboardContent -notmatch 'href:\s*"/admin/workshop-notices"') {
        $newCard = @'
  {
    title: "Workshop Posters",
    description:
      "Upload, edit, publish, reorder, and remove homepage workshop posters and registration notices.",
    href: "/admin/workshop-notices",
    tag: "Homepage",
  },
'@

        $adminDashboardContent = $adminDashboardContent.Replace(
            'const adminCards = [' + "`r`n",
            'const adminCards = [' + "`r`n" + $newCard
        )

        Write-Utf8 $adminDashboardPath $adminDashboardContent
    }
}

# -------------------------------------------------------------------
# 8. Clear Next cache
# -------------------------------------------------------------------

Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Admin workshop poster manager integrated." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT - one-time database setup:" -ForegroundColor Yellow
Write-Host "  Open Supabase Dashboard -> SQL Editor."
Write-Host "  Run the contents of WORKSHOP-NOTICES-SETUP.sql once."
Write-Host ""
Write-Host "Then build:" -ForegroundColor Cyan
Write-Host "  npm.cmd run build"
Write-Host ""
Write-Host "After deployment, open:" -ForegroundColor Cyan
Write-Host "  /admin"
Write-Host "  -> Workshop Posters"
Write-Host ""
Write-Host "From there you can:" -ForegroundColor Cyan
Write-Host "  - upload/replace poster images"
Write-Host "  - edit title, summary, date, venue, badge, and link"
Write-Host "  - publish/unpublish posters"
Write-Host "  - change display order"
Write-Host "  - delete posters"
