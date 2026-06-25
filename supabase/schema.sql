-- LexData LMS data pool for Supabase/Postgres
-- Run this in Supabase SQL Editor after creating a new project.

create extension if not exists "uuid-ossp";

-- Clean re-run helpers for development only. Comment these out when you have real users.
-- drop table if exists public.resources cascade;
-- drop table if exists public.announcements cascade;
-- drop table if exists public.lesson_progress cascade;
-- drop table if exists public.enrollments cascade;
-- drop table if exists public.lessons cascade;
-- drop table if exists public.courses cascade;
-- drop table if exists public.categories cascade;
-- drop table if exists public.profiles cascade;
-- drop type if exists user_role cascade;
-- drop type if exists enrollment_status cascade;

create type user_role as enum ('student', 'instructor', 'admin');
create type enrollment_status as enum ('active', 'completed', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  instructor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  short_description text,
  intro text,
  level text default 'Beginner',
  language text default 'English',
  cover_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  position int not null default 1,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, position)
);

create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;

drop policy if exists "profiles can view own profile" on public.profiles;
drop policy if exists "profiles can update own profile" on public.profiles;
drop policy if exists "admins can manage profiles" on public.profiles;
drop policy if exists "public can read categories" on public.categories;
drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "public can read published courses" on public.courses;
drop policy if exists "admins instructors manage courses" on public.courses;
drop policy if exists "public can read published lessons" on public.lessons;
drop policy if exists "admins manage lessons" on public.lessons;
drop policy if exists "users view own enrollments" on public.enrollments;
drop policy if exists "users enroll themselves" on public.enrollments;
drop policy if exists "admins manage enrollments" on public.enrollments;
drop policy if exists "users manage own lesson progress" on public.lesson_progress;
drop policy if exists "admins view progress" on public.lesson_progress;
drop policy if exists "public read published announcements" on public.announcements;
drop policy if exists "admins manage announcements" on public.announcements;
drop policy if exists "public read resources" on public.resources;
drop policy if exists "admins manage resources" on public.resources;

create policy "profiles can view own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins can manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "public can read categories" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "public can read published courses" on public.courses for select using (is_published = true or public.is_admin() or instructor_id = auth.uid());
create policy "admins instructors manage courses" on public.courses for all using (public.is_admin() or instructor_id = auth.uid()) with check (public.is_admin() or instructor_id = auth.uid());

create policy "public can read published lessons" on public.lessons for select using (
  (is_published = true and exists (select 1 from public.courses c where c.id = course_id and c.is_published = true))
  or public.is_admin()
);
create policy "admins manage lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

create policy "users view own enrollments" on public.enrollments for select using (auth.uid() = user_id or public.is_admin());
create policy "users enroll themselves" on public.enrollments for insert with check (auth.uid() = user_id);
create policy "admins manage enrollments" on public.enrollments for all using (public.is_admin()) with check (public.is_admin());

create policy "users manage own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins view progress" on public.lesson_progress for select using (public.is_admin());

create policy "public read published announcements" on public.announcements for select using (is_published = true or public.is_admin());
create policy "admins manage announcements" on public.announcements for all using (public.is_admin()) with check (public.is_admin());

create policy "public read resources" on public.resources for select using (true);
create policy "admins manage resources" on public.resources for all using (public.is_admin()) with check (public.is_admin());

insert into public.categories (name, slug) values
('Corpus Development', 'corpus-development'),
('Workshops & Training', 'workshops-training'),
('Consulting & Research Support', 'consulting-research-support'),
('Research Methods', 'research-methods')
on conflict do nothing;

insert into public.courses (category_id, title, slug, short_description, intro, level, language, is_published)
select id, 'Python for Language Sciences and Social Sciences', 'python-language-social-sciences',
'Corpus analysis, text mining, and digital research workflows for researchers in language, education, and social sciences.',
'This LexData workshop introduces practical Python workflows for language sciences and social science research. Students learn how to prepare datasets, clean text, build small corpora, perform basic text mining, and create reproducible reports. The course is designed for researchers who do not want abstract programming theory, but need hands-on digital research skills.',
'Beginner', 'English', true
from public.categories where slug = 'workshops-training'
on conflict do nothing;

insert into public.courses (category_id, title, slug, short_description, intro, level, language, is_published)
select id, 'Web Scraping and Textual Data Curation for Researchers', 'web-scraping-text-data-curation',
'Collect, clean, structure, and document web-based textual data for corpus and social research projects.',
'This course teaches practical web scraping and textual data curation for academic research. It covers project planning, ethical scraping principles, metadata design, multilingual text cleaning, and preparation of datasets for NLP, corpus linguistics, education, and social inquiry.',
'Intermediate', 'English', true
from public.categories where slug = 'corpus-development'
on conflict do nothing;

insert into public.courses (category_id, title, slug, short_description, intro, level, language, is_published)
select id, 'SPSS, R, and Power BI for Research Reporting', 'spss-r-powerbi-research-reporting',
'Statistical modeling, visualization, and reporting workflows for institutional and academic research.',
'This LexData training helps researchers move from raw survey or institutional data to meaningful statistical reports and visual dashboards. It combines SPSS/R workflows with Power BI reporting so that outputs can be used for papers, institutional reporting, and presentations.',
'Beginner to Intermediate', 'English', true
from public.categories where slug = 'workshops-training'
on conflict do nothing;

insert into public.lessons (course_id, title, content, video_url, position, is_published)
select id, 'Workshop overview and research setup', 'Understand the LexData workflow: research question, dataset design, metadata, reproducibility, and expected outputs.', null, 1, true
from public.courses where slug = 'python-language-social-sciences'
on conflict do nothing;

insert into public.lessons (course_id, title, content, video_url, position, is_published)
select id, 'Cleaning multilingual text data', 'Learn practical steps for cleaning English, Chinese, Arabic, Mongolian, and mixed-language research text before analysis.', null, 2, true
from public.courses where slug = 'python-language-social-sciences'
on conflict do nothing;

insert into public.lessons (course_id, title, content, video_url, position, is_published)
select id, 'Corpus analysis and text mining basics', 'Build small frequency tables, keyword lists, concordance-style views, and simple visual summaries for research interpretation.', null, 3, true
from public.courses where slug = 'python-language-social-sciences'
on conflict do nothing;

insert into public.lessons (course_id, title, content, video_url, position, is_published)
select id, 'Responsible data collection', 'Plan scraping targets, respect website policies, record metadata, and keep a reproducible data collection log.', null, 1, true
from public.courses where slug = 'web-scraping-text-data-curation'
on conflict do nothing;

insert into public.lessons (course_id, title, content, video_url, position, is_published)
select id, 'From spreadsheet to research dashboard', 'Prepare variables, run descriptive analysis, and create clear charts for academic and institutional reporting.', null, 1, true
from public.courses where slug = 'spss-r-powerbi-research-reporting'
on conflict do nothing;
