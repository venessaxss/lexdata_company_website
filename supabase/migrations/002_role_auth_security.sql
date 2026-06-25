-- Role authentication and dashboard customization security patch.
-- Run after supabase/schema.sql and 001_roles_workshops_payments.sql.

-- 1) Make sure the enum supports the final role system.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'speaker', 'manager', 'admin');
  end if;

  if not exists (select 1 from pg_enum where enumlabel = 'speaker' and enumtypid = 'user_role'::regtype) then
    alter type user_role add value 'speaker';
  end if;

  if not exists (select 1 from pg_enum where enumlabel = 'manager' and enumtypid = 'user_role'::regtype) then
    alter type user_role add value 'manager';
  end if;
end $$;

-- 2) Add role audit fields.
alter table public.profiles
  add column if not exists role_changed_at timestamptz,
  add column if not exists role_changed_by uuid references public.profiles(id) on delete set null;

-- 3) Helper functions used by RLS and server pages.
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
  select public.has_role('speaker') or public.has_role('instructor') or public.has_role('admin');
$$ language sql stable security definer;

-- 4) Critical security: users may update their own profile, but NOT their own role.
-- Only an admin, service role, or direct SQL maintenance can change role.
create or replace function public.prevent_non_admin_role_change()
returns trigger as $$
declare
  jwt_role text;
begin
  jwt_role := current_setting('request.jwt.claim.role', true);

  if new.role is distinct from old.role then
    if jwt_role = 'service_role' or auth.uid() is null then
      new.role_changed_at := now();
      return new;
    end if;

    if not public.is_admin() then
      raise exception 'Only admins can change user roles';
    end if;

    new.role_changed_at := now();
    new.role_changed_by := auth.uid();
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_non_admin_role_change_trigger on public.profiles;
create trigger prevent_non_admin_role_change_trigger
before update on public.profiles
for each row execute function public.prevent_non_admin_role_change();

-- 5) Refresh policies for profiles. Normal users can view/update their own profile.
-- Admins can view/update all profiles. Trigger blocks non-admin role changes.
drop policy if exists "profiles can view own profile" on public.profiles;
drop policy if exists "profiles can update own profile" on public.profiles;
drop policy if exists "admins can manage profiles" on public.profiles;
drop policy if exists "managers speakers can view relevant profiles" on public.profiles;

create policy "profiles can view own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin() or public.is_manager_or_admin());

create policy "profiles can update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "admins can manage profiles" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "speakers can view own attendees profiles" on public.profiles
for select using (
  public.is_admin()
  or public.is_manager_or_admin()
  or exists (
    select 1
    from public.workshop_registrations wr
    join public.workshop_sessions ws on ws.id = wr.session_id
    where wr.user_id = profiles.id and ws.speaker_id = auth.uid()
  )
);

-- 6) Helpful index for role dashboards and admin user page.
create index if not exists idx_profiles_role on public.profiles(role);
