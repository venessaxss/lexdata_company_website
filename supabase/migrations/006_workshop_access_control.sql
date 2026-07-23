-- Workshop explicit access control

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

-- Existing confirmed/paid users keep access unless they were explicitly revoked.
update public.workshop_registrations
set access_status = 'granted'
where access_status is null
and (
  payment_status in ('confirmed', 'paid')
  or registration_status = 'confirmed'
);