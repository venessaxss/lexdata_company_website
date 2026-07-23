-- Explicit workshop access override for manager/admin controls.

alter table public.workshop_registrations
add column if not exists access_status text;

alter table public.workshop_registrations
drop constraint if exists workshop_registrations_access_status_check;

alter table public.workshop_registrations
add constraint workshop_registrations_access_status_check
check (
  access_status is null
  or access_status in (
    'pending',
    'granted',
    'revoked',
    'blocked',
    'denied',
    'suspended'
  )
);

create index if not exists workshop_registrations_access_status_idx
on public.workshop_registrations(access_status);