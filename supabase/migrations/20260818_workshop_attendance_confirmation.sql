begin;

alter table public.workshop_registrations
  add column if not exists attendance_status text not null default 'not_confirmed',
  add column if not exists attendance_confirmed_at timestamptz,
  add column if not exists attendance_confirmed_by uuid references public.profiles(id) on delete set null,
  add column if not exists attendance_note text;

-- Workshop certificates now require a participant application after an admin
-- attendance decision. Keep this trigger responsible only for confirmed-payment
-- receipts so changing a registration status cannot bypass that workflow.
create or replace function public.receipt_from_workshop_registration()
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workshop_registrations_attendance_status_check'
      and conrelid = 'public.workshop_registrations'::regclass
  ) then
    alter table public.workshop_registrations
      add constraint workshop_registrations_attendance_status_check
      check (attendance_status in ('not_confirmed', 'attended', 'absent', 'excused'));
  end if;
end
$$;

-- Preserve eligibility created by the previous combined "completed" status,
-- then return registration status to its single purpose.
update public.workshop_registrations
set attendance_status = 'attended',
    attendance_confirmed_at = coalesce(updated_at, now())
where registration_status = 'completed'
  and attendance_status = 'not_confirmed';

update public.workshop_registrations
set registration_status = 'confirmed'
where registration_status = 'completed';

create index if not exists workshop_registrations_attendance_idx
  on public.workshop_registrations (user_id, registration_status, attendance_status);

comment on column public.workshop_registrations.attendance_status is
  'Attendance decision recorded by an admin or manager in Registration Management.';
comment on column public.workshop_registrations.attendance_confirmed_by is
  'Admin or manager who most recently confirmed attendance.';

notify pgrst, 'reload schema';

commit;
