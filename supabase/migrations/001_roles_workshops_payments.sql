-- Add role-based navigation, workshops, purchased courses, registrations, and payments.
-- Run this after the original supabase/schema.sql.

-- 1) Expand roles. If you already created user_role, add these values safely.
do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'speaker' and enumtypid = 'user_role'::regtype) then
    alter type user_role add value 'speaker';
  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'manager' and enumtypid = 'user_role'::regtype) then
    alter type user_role add value 'manager';
  end if;
exception
  when undefined_object then
    create type user_role as enum ('student', 'speaker', 'manager', 'admin');
end $$;

-- 2) Payment/product fields for paid courses.
alter table public.courses
  add column if not exists price_cents integer not null default 0,
  add column if not exists currency text not null default 'usd',
  add column if not exists stripe_price_id text;

-- 3) Workshop/training products and sessions.
create table if not exists public.workshops (
  id uuid primary key default uuid_generate_v4(),
  speaker_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  short_description text,
  intro text,
  cover_url text,
  level text default 'All levels',
  language text default 'English',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_sessions (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  speaker_id uuid references public.profiles(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer,
  meeting_url text,
  location text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  stripe_price_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  status text not null default 'registered',
  payment_id uuid,
  created_at timestamptz not null default now(),
  unique(user_id, session_id)
);

-- 4) Payment records. This is your management/payment pool.
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_type text not null check (product_type in ('course', 'workshop')),
  product_id uuid not null,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'workshop_registrations_payment_id_fkey'
  ) then
    alter table public.workshop_registrations
      add constraint workshop_registrations_payment_id_fkey
      foreign key (payment_id) references public.payments(id) on delete set null;
  end if;
end $$;

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_workshop_sessions_speaker_id on public.workshop_sessions(speaker_id);
create index if not exists idx_workshop_registrations_user_id on public.workshop_registrations(user_id);
create index if not exists idx_enrollments_user_id on public.enrollments(user_id);

-- 5) Role helper functions.
create or replace function public.has_role(role_name text)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = role_name
  );
$$ language sql stable security definer;

create or replace function public.is_admin()
returns boolean as $$
  select public.has_role('admin');
$$ language sql stable security definer;

create or replace function public.is_manager_or_admin()
returns boolean as $$
  select public.has_role('manager') or public.has_role('admin');
$$ language sql stable security definer;

create or replace function public.is_speaker_or_admin()
returns boolean as $$
  select public.has_role('speaker') or public.has_role('admin');
$$ language sql stable security definer;

-- 6) Enable RLS on new tables.
alter table public.workshops enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.workshop_registrations enable row level security;
alter table public.payments enable row level security;

-- 7) Policies.
drop policy if exists "public read published workshops" on public.workshops;
drop policy if exists "admins speakers manage workshops" on public.workshops;
drop policy if exists "public read published workshop sessions" on public.workshop_sessions;
drop policy if exists "admins speakers manage workshop sessions" on public.workshop_sessions;
drop policy if exists "users view own workshop registrations" on public.workshop_registrations;
drop policy if exists "users register themselves" on public.workshop_registrations;
drop policy if exists "managers speakers view registrations" on public.workshop_registrations;
drop policy if exists "managers manage workshop registrations" on public.workshop_registrations;
drop policy if exists "users view own payments" on public.payments;
drop policy if exists "users create own pending payments" on public.payments;
drop policy if exists "managers manage payments" on public.payments;

create policy "public read published workshops" on public.workshops
for select using (is_published = true or public.is_manager_or_admin() or speaker_id = auth.uid());

create policy "admins speakers manage workshops" on public.workshops
for all using (public.is_admin() or speaker_id = auth.uid())
with check (public.is_admin() or speaker_id = auth.uid());

create policy "public read published workshop sessions" on public.workshop_sessions
for select using (
  is_published = true
  or public.is_manager_or_admin()
  or speaker_id = auth.uid()
);

create policy "admins speakers manage workshop sessions" on public.workshop_sessions
for all using (public.is_admin() or speaker_id = auth.uid())
with check (public.is_admin() or speaker_id = auth.uid());

create policy "users view own workshop registrations" on public.workshop_registrations
for select using (auth.uid() = user_id);

create policy "users register themselves" on public.workshop_registrations
for insert with check (auth.uid() = user_id);

create policy "managers speakers view registrations" on public.workshop_registrations
for select using (
  public.is_manager_or_admin()
  or exists (
    select 1
    from public.workshop_sessions ws
    where ws.id = session_id and ws.speaker_id = auth.uid()
  )
);

create policy "managers manage workshop registrations" on public.workshop_registrations
for all using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

create policy "users view own payments" on public.payments
for select using (auth.uid() = user_id or public.is_manager_or_admin());

create policy "users create own pending payments" on public.payments
for insert with check (auth.uid() = user_id and status = 'pending');

create policy "managers manage payments" on public.payments
for all using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

-- 8) Demo workshop data.
insert into public.workshops (title, slug, short_description, intro, level, language, is_published)
values (
  'SSCI Research Article Writing Workshop',
  'ssci-research-article-writing',
  'A practical workshop on research ideas, article structure, journal targeting, and revision strategy.',
  'This live training workshop helps participants develop publishable research articles. It covers topic positioning, literature framing, data presentation, discussion writing, and reviewer-response strategy.',
  'Intermediate',
  'English / Chinese',
  true
)
on conflict (slug) do nothing;

insert into public.workshop_sessions (workshop_id, title, starts_at, ends_at, capacity, price_cents, currency, is_published)
select id,
       'Live Cohort 1: Research Article Bootcamp',
       now() + interval '14 days',
       now() + interval '14 days' + interval '2 hours',
       50,
       9900,
       'usd',
       true
from public.workshops
where slug = 'ssci-research-article-writing'
on conflict do nothing;

-- 9) Let managers see user names for finance, and speakers see attendee names for their own sessions.
drop policy if exists "managers speakers can view relevant profiles" on public.profiles;
create policy "managers speakers can view relevant profiles" on public.profiles
for select using (
  public.is_manager_or_admin()
  or exists (
    select 1
    from public.workshop_registrations wr
    join public.workshop_sessions ws on ws.id = wr.session_id
    where wr.user_id = profiles.id and ws.speaker_id = auth.uid()
  )
);
