-- Password/OAuth auth support.
-- Run this after your previous schema and role-auth migrations.
-- It makes sure every new Supabase auth user gets a public.profiles row.

create or replace function public.handle_new_user()
returns trigger
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles for users created before the trigger was fixed.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  'student'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
