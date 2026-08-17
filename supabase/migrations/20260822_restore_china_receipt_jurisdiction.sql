begin;

alter table public.receipt_applications
drop constraint if exists receipt_applications_jurisdiction_check;

alter table public.receipt_applications
add constraint receipt_applications_jurisdiction_check
check (jurisdiction in ('PK', 'SA', 'CN'));

notify pgrst, 'reload schema';

commit;