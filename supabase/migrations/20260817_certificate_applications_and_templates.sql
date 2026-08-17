begin;

create table if not exists public.certificate_templates (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  template_name text not null,
  background_url text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  text_color text not null default '#0B2545' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  name_top_percent integer not null default 45 check (name_top_percent between 20 and 75),
  program_top_percent integer not null default 61 check (program_top_percent between 35 and 85),
  details_top_percent integer not null default 81 check (details_top_percent between 55 and 94),
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_one_active_certificate_template_per_workshop
on public.certificate_templates(workshop_id)
where is_active = true;

create table if not exists public.certificate_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workshop_registration_id uuid not null references public.workshop_registrations(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  preferred_name text not null check (char_length(trim(preferred_name)) between 2 and 120),
  participant_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  admin_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  document_id uuid references public.official_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workshop_registration_id)
);

create index if not exists idx_certificate_applications_admin_queue
on public.certificate_applications(status, created_at);
create index if not exists idx_certificate_applications_user
on public.certificate_applications(user_id, created_at desc);

alter table public.certificate_templates enable row level security;
alter table public.certificate_applications enable row level security;

drop policy if exists "admins manage certificate templates" on public.certificate_templates;
create policy "admins manage certificate templates" on public.certificate_templates
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "participants view own certificate applications" on public.certificate_applications;
create policy "participants view own certificate applications" on public.certificate_applications
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "participants create certificate applications" on public.certificate_applications;
create policy "participants create certificate applications" on public.certificate_applications
for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins manage certificate applications" on public.certificate_applications;
create policy "admins manage certificate applications" on public.certificate_applications
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificate-templates',
  'certificate-templates',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload certificate templates" on storage.objects;
create policy "admins upload certificate templates" on storage.objects
for insert with check (bucket_id = 'certificate-templates' and public.is_admin());

drop policy if exists "admins update certificate templates" on storage.objects;
create policy "admins update certificate templates" on storage.objects
for update using (bucket_id = 'certificate-templates' and public.is_admin())
with check (bucket_id = 'certificate-templates' and public.is_admin());

drop policy if exists "admins delete certificate templates" on storage.objects;
create policy "admins delete certificate templates" on storage.objects
for delete using (bucket_id = 'certificate-templates' and public.is_admin());

-- Workshop completion now creates eligibility only. A certificate is prepared
-- after the participant applies and an admin approves that application.
create or replace function public.receipt_only_from_workshop_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_json jsonb := to_jsonb(new);
  old_json jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  workshop_title text;
  workshop_id uuid;
  amount_value numeric;
begin
  amount_value := nullif(row_json->>'amount_received', '')::numeric;
  if row_json->>'payment_status' = 'confirmed'
     and coalesce(old_json->>'payment_status', '') is distinct from 'confirmed'
     and amount_value > 0 then
    workshop_id := nullif(row_json->>'workshop_id', '')::uuid;
    select title into workshop_title from public.workshops where id = workshop_id;
    perform public.issue_confirmed_payment_receipt(
      (row_json->>'user_id')::uuid, 'workshop_registration', new.id,
      coalesce(workshop_title, 'LexData workshop'), amount_value,
      coalesce(row_json->>'payment_currency', 'USD'), now(),
      coalesce(nullif(row_json->>'document_jurisdiction', ''), 'PK'),
      jsonb_build_object('confirmation_method', 'admin_review')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists create_documents_from_workshop_registration on public.workshop_registrations;
drop trigger if exists create_receipt_only_from_workshop_registration on public.workshop_registrations;
create trigger create_receipt_only_from_workshop_registration
after update on public.workshop_registrations
for each row execute function public.receipt_only_from_workshop_registration();

revoke all on function public.receipt_only_from_workshop_registration() from public, anon, authenticated;
grant execute on function public.receipt_only_from_workshop_registration() to service_role;

notify pgrst, 'reload schema';
commit;
