-- 004_about_content.sql
-- Editable About page content + access for BOTH admin and manager roles.
-- Run in Supabase SQL Editor (safe to re-run).

create or replace function public.is_admin_or_manager()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
$$ language sql stable security definer;

create table if not exists public.about_sections (
  id text primary key,
  kicker text,
  heading text,
  body text,
  items jsonb not null default '[]'::jsonb,
  sort integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.about_sections enable row level security;

drop policy if exists "about sections are public" on public.about_sections;
drop policy if exists "admins and managers manage about" on public.about_sections;

create policy "about sections are public"
  on public.about_sections for select
  using (true);

create policy "admins and managers manage about"
  on public.about_sections for all
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

-- Seed content (idempotent; keeps any edits already made)
insert into public.about_sections (id, kicker, heading, body, items, sort) values
  (
    'intro',
    'Who we are',
    'We''re humanists who build data systems.',
    'LexData is a research-driven data solutions company focused on language sciences, translation, education, ELT, and social sciences. We specialize in the collection, processing, analysis, and interpretation of large datasets using Python, R, NLP, and data science workflows.',
    '[]'::jsonb,
    0
  ),
  (
    'mission',
    'Our mission',
    'Bridging humanities and data science for real-world impact.',
    'We help researchers, translators, and educators turn language into evidence — with methods that stand up to review and results you can explain.',
    '[]'::jsonb,
    1
  ),
  (
    'why',
    'Why LexData?',
    'The bridge, not just the code.',
    null,
    '["Built by researchers who publish, not just ship", "Multilingual by default — English, 中文, العربية and beyond", "Every claim backed by an evaluation you can see", "Training that meets humanists where they are"]'::jsonb,
    2
  ),
  (
    'aims',
    'Our aims',
    'Three things we''re building toward.',
    null,
    '["Research-grade language data | Corpora and annotation pipelines with the care of a critical edition.", "Honest, useful models | Trained on documented data, benchmarked in the open, never oversold.", "A wider door into data science | Courses and workshops that turn language people into data people."]'::jsonb,
    3
  ),
  (
    'stance',
    'A principled alternative',
    'By humanists, for humanists.',
    'We think researchers and learners should be free to work with language — away from black boxes, inflated claims, and the prying eyes of data brokers.',
    '["Your data is YOURS.", "Human-annotated — always.", "Honest benchmarks. No hype."]'::jsonb,
    4
  ),
  (
    'quote',
    null,
    null,
    'The limits of my language mean the limits of my world.',
    '["Ludwig Wittgenstein"]'::jsonb,
    5
  )
on conflict (id) do nothing;
