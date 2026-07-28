-- Course-wise registration management fields.
-- Existing enrollments remain accessible after this migration.

alter table public.enrollments
  add column if not exists registration_status text
  not null default 'confirmed';

alter table public.enrollments
  add column if not exists payment_status text
  not null default 'waived';

alter table public.enrollments
  add column if not exists access_status text
  not null default 'granted';

alter table public.enrollments
  add column if not exists amount_received numeric(14, 2)
  not null default 0;

alter table public.enrollments
  add column if not exists payment_currency text
  not null default 'USD';

alter table public.enrollments
  add column if not exists payment_note text;

alter table public.enrollments
  add column if not exists receipt_url text;

alter table public.enrollments
  add column if not exists updated_at timestamptz
  not null default now();

alter table public.enrollments
  drop constraint if exists enrollments_registration_status_check;

alter table public.enrollments
  add constraint enrollments_registration_status_check
  check (
    registration_status in (
      'pending',
      'confirmed',
      'rejected',
      'cancelled'
    )
  );

alter table public.enrollments
  drop constraint if exists enrollments_payment_status_check;

alter table public.enrollments
  add constraint enrollments_payment_status_check
  check (
    payment_status in (
      'pending',
      'confirmed',
      'paid',
      'waived',
      'refunded'
    )
  );

alter table public.enrollments
  drop constraint if exists enrollments_access_status_check;

alter table public.enrollments
  add constraint enrollments_access_status_check
  check (
    access_status in (
      'pending',
      'granted',
      'revoked',
      'blocked'
    )
  );

create index if not exists enrollments_course_id_idx
on public.enrollments(course_id);

create index if not exists enrollments_course_status_idx
on public.enrollments(
  course_id,
  registration_status,
  payment_status,
  access_status
);

notify pgrst, 'reload schema';