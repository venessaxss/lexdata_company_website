begin;

update public.workshop_registrations
set
  payment_status = 'under_review',
  updated_at = now()
where payment_status = 'confirmed'
  and coalesce(amount_received, 0) <= 0;

create or replace function public.enforce_workshop_confirmed_payment_amount()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_status = 'confirmed'
     and coalesce(new.amount_received, 0) <= 0 then
    raise exception
      'Confirmed workshop payment requires amount_received > 0';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_workshop_confirmed_payment_amount
on public.workshop_registrations;

create trigger enforce_workshop_confirmed_payment_amount
before insert or update of payment_status, amount_received
on public.workshop_registrations
for each row
execute function public.enforce_workshop_confirmed_payment_amount();

notify pgrst, 'reload schema';

commit;