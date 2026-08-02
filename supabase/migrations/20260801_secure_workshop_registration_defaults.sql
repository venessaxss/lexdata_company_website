begin;

alter table public.workshop_registrations
  alter column registration_status set default 'pending';

alter table public.workshop_registrations
  alter column payment_status set default 'pending';

alter table public.workshop_registrations
  alter column access_status set default 'pending';

update public.workshop_registrations
set
  registration_status = coalesce(registration_status, 'pending'),
  payment_status = coalesce(payment_status, 'pending'),
  access_status = coalesce(access_status, 'pending')
where registration_status is null
   or payment_status is null
   or access_status is null;

update public.workshop_registrations
set
  payment_status = 'pending',
  access_status = 'pending'
where registration_status = 'pending'
  and payment_status = 'waived'
  and access_status = 'granted';

create or replace function public.force_new_workshop_registration_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.registration_status := 'pending';
  new.payment_status := 'pending';
  new.access_status := 'pending';
  return new;
end;
$$;

drop trigger if exists workshop_registration_initial_state
on public.workshop_registrations;

create trigger workshop_registration_initial_state
before insert on public.workshop_registrations
for each row
execute function public.force_new_workshop_registration_pending();

notify pgrst, 'reload schema';

commit;