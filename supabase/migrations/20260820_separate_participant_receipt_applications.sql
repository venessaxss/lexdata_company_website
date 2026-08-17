begin;

create table if not exists public.receipt_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workshop_registration_id uuid not null references public.workshop_registrations(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  jurisdiction text not null default 'PK' check (jurisdiction in ('PK', 'SA')),
  recipient_type text not null default 'personal' check (recipient_type in ('personal', 'company')),
  recipient_name text not null check (char_length(trim(recipient_name)) between 2 and 180),
  recipient_registration_number text not null check (char_length(trim(recipient_registration_number)) between 2 and 120),
  recipient_tax_number text,
  recipient_vat_number text,
  recipient_email text not null,
  recipient_phone text,
  recipient_address text,
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

create index if not exists idx_receipt_applications_admin_queue
on public.receipt_applications(status, created_at);

create index if not exists idx_receipt_applications_user
on public.receipt_applications(user_id, created_at desc);

alter table public.receipt_applications enable row level security;

drop policy if exists "participants view own receipt applications"
on public.receipt_applications;
create policy "participants view own receipt applications"
on public.receipt_applications
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "participants create receipt applications"
on public.receipt_applications;
create policy "participants create receipt applications"
on public.receipt_applications
for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins manage receipt applications"
on public.receipt_applications;
create policy "admins manage receipt applications"
on public.receipt_applications
for all using (public.is_admin()) with check (public.is_admin());

-- Stop automatic workshop-receipt issuance. Payment confirmation now makes
-- the registration eligible for a participant receipt application.
drop trigger if exists create_receipt_only_from_workshop_registration
on public.workshop_registrations;

drop trigger if exists create_documents_from_workshop_registration
on public.workshop_registrations;

notify pgrst, 'reload schema';

commit;
