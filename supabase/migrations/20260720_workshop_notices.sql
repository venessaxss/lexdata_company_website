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