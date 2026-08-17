begin;

create extension if not exists "pgcrypto";

-- Participant-selected display name. Issued documents keep a snapshot so that
-- later profile edits do not silently alter an already released document.
alter table public.profiles
  add column if not exists preferred_certificate_name text,
  add column if not exists email text;

create table if not exists public.document_issuer_profiles (
  jurisdiction text primary key check (jurisdiction in ('PK', 'SA', 'CN')),
  legal_name text not null default 'LexData Research & Training',
  trading_name text,
  registered_address text,
  tax_registration_number text,
  secondary_registration_number text,
  contact_email text,
  vat_registered boolean not null default false,
  tax_invoice_enabled boolean not null default false,
  authority_integration_status text not null default 'not_connected'
    check (authority_integration_status in ('not_connected', 'testing', 'connected')),
  compliance_note text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.document_issuer_profiles (jurisdiction, compliance_note)
values
  ('PK', 'Proof-of-payment receipts are not FBR fiscal invoices unless a valid STRN and an approved fiscal integration are configured.'),
  ('SA', 'Proof-of-payment receipts are not ZATCA FATOORAH tax invoices unless a compliant EGS integration is connected.'),
  ('CN', 'Proof-of-payment receipts are not official fapiao. Fapiao must be issued and verified through the tax authority electronic invoice platform.')
on conflict (jurisdiction) do nothing;

create sequence if not exists public.receipt_document_number_seq;
create sequence if not exists public.certificate_document_number_seq;

create table if not exists public.official_documents (
  id uuid primary key default uuid_generate_v4(),
  document_type text not null check (document_type in ('receipt', 'certificate')),
  document_number text not null unique,
  verification_code text not null unique default encode(gen_random_bytes(16), 'hex'),
  user_id uuid not null references public.profiles(id) on delete restrict,
  source_type text not null check (source_type in ('payment', 'workshop_registration', 'course_enrollment')),
  source_id uuid not null,
  jurisdiction text not null default 'PK' check (jurisdiction in ('PK', 'SA', 'CN')),
  status text not null check (status in ('pending_review', 'issued', 'revoked', 'void')),
  recipient_name text not null,
  recipient_email text,
  title text not null,
  description text,
  amount numeric(14,2),
  currency text,
  payment_confirmed_at timestamptz,
  completed_at timestamptz,
  issued_at timestamptz,
  issued_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revocation_reason text,
  is_tax_document boolean not null default false,
  authority_reference text,
  external_invoice_url text,
  issuer_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, source_type, source_id),
  check (
    (document_type = 'receipt' and amount is not null and amount > 0 and payment_confirmed_at is not null)
    or document_type = 'certificate'
  ),
  check (not is_tax_document or authority_reference is not null)
);

create table if not exists public.official_document_audit_log (
  id bigint generated always as identity primary key,
  document_id uuid references public.official_documents(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_official_documents_user on public.official_documents(user_id, created_at desc);
create index if not exists idx_official_documents_status on public.official_documents(status, document_type);
create index if not exists idx_official_document_audit_document on public.official_document_audit_log(document_id, created_at desc);

alter table public.document_issuer_profiles enable row level security;
alter table public.official_documents enable row level security;
alter table public.official_document_audit_log enable row level security;

drop policy if exists "users view their own official documents" on public.official_documents;
create policy "users view their own official documents" on public.official_documents
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins manage official documents" on public.official_documents;
create policy "admins manage official documents" on public.official_documents
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff view document audit" on public.official_document_audit_log;
create policy "staff view document audit" on public.official_document_audit_log
for select using (public.is_admin());

drop policy if exists "admins manage document audit" on public.official_document_audit_log;
create policy "admins manage document audit" on public.official_document_audit_log
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff view issuer profiles" on public.document_issuer_profiles;
create policy "staff view issuer profiles" on public.document_issuer_profiles
for select using (public.is_admin());

drop policy if exists "admins manage issuer profiles" on public.document_issuer_profiles;
create policy "admins manage issuer profiles" on public.document_issuer_profiles
for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.document_number(p_type text, p_jurisdiction text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  serial_value bigint;
  prefix text;
begin
  if p_type = 'receipt' then
    serial_value := nextval('public.receipt_document_number_seq');
    prefix := 'R';
  else
    serial_value := nextval('public.certificate_document_number_seq');
    prefix := 'C';
  end if;

  return format('LD-%s-%s-%s-%s', prefix, p_jurisdiction,
    to_char(current_date, 'YYYY'), lpad(serial_value::text, 8, '0'));
end;
$$;

create or replace function public.issue_confirmed_payment_receipt(
  p_user_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_title text,
  p_amount numeric,
  p_currency text,
  p_confirmed_at timestamptz,
  p_jurisdiction text default 'PK',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
  issuer record;
  result_id uuid;
  safe_jurisdiction text;
begin
  if p_amount is null or p_amount <= 0 or p_confirmed_at is null then
    raise exception 'A receipt requires a confirmed positive amount';
  end if;

  safe_jurisdiction := case when p_jurisdiction in ('PK', 'SA', 'CN') then p_jurisdiction else 'PK' end;

  select preferred_certificate_name, full_name, email
    into recipient
  from public.profiles
  where id = p_user_id;

  if recipient is null then
    raise exception 'Participant profile not found';
  end if;

  select * into issuer
  from public.document_issuer_profiles
  where jurisdiction = safe_jurisdiction;

  insert into public.official_documents (
    document_type, document_number, user_id, source_type, source_id,
    jurisdiction, status, recipient_name, recipient_email, title,
    amount, currency, payment_confirmed_at, issued_at, issuer_snapshot, metadata
  ) values (
    'receipt', public.document_number('receipt', safe_jurisdiction), p_user_id,
    p_source_type, p_source_id, safe_jurisdiction, 'issued',
    coalesce(nullif(trim(recipient.preferred_certificate_name), ''), nullif(trim(recipient.full_name), ''), recipient.email, 'Participant'),
    recipient.email, p_title, round(p_amount, 2), upper(p_currency), p_confirmed_at, now(),
    to_jsonb(issuer), coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (document_type, source_type, source_id) do update
    set updated_at = now()
  returning id into result_id;

  return result_id;
end;
$$;

create or replace function public.prepare_completion_certificate(
  p_user_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_title text,
  p_completed_at timestamptz,
  p_jurisdiction text default 'PK',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
  issuer record;
  result_id uuid;
  safe_jurisdiction text;
begin
  safe_jurisdiction := case when p_jurisdiction in ('PK', 'SA', 'CN') then p_jurisdiction else 'PK' end;

  select preferred_certificate_name, full_name, email
    into recipient
  from public.profiles
  where id = p_user_id;

  if recipient is null then
    raise exception 'Participant profile not found';
  end if;

  select * into issuer
  from public.document_issuer_profiles
  where jurisdiction = safe_jurisdiction;

  insert into public.official_documents (
    document_type, document_number, user_id, source_type, source_id,
    jurisdiction, status, recipient_name, recipient_email, title,
    completed_at, issuer_snapshot, metadata
  ) values (
    'certificate', public.document_number('certificate', safe_jurisdiction), p_user_id,
    p_source_type, p_source_id, safe_jurisdiction, 'pending_review',
    coalesce(nullif(trim(recipient.preferred_certificate_name), ''), nullif(trim(recipient.full_name), ''), recipient.email, 'Participant'),
    recipient.email, p_title, coalesce(p_completed_at, now()), to_jsonb(issuer), coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (document_type, source_type, source_id) do update
    set updated_at = now()
  returning id into result_id;

  return result_id;
end;
$$;

create or replace function public.audit_official_document_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.official_document_audit_log (
    document_id, actor_id, action, from_status, to_status, details
  ) values (
    new.id,
    auth.uid(),
    case when tg_op = 'INSERT' then 'created' else 'status_changed' end,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    jsonb_build_object('document_number', new.document_number, 'document_type', new.document_type)
  );
  return new;
end;
$$;

drop trigger if exists audit_official_document_insert on public.official_documents;
create trigger audit_official_document_insert
after insert on public.official_documents
for each row execute function public.audit_official_document_change();

drop trigger if exists audit_official_document_update on public.official_documents;
create trigger audit_official_document_update
after update of status on public.official_documents
for each row when (old.status is distinct from new.status)
execute function public.audit_official_document_change();

create or replace function public.receipt_from_payment_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_title text;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if new.product_type = 'course' then
      select title into item_title from public.courses where id = new.product_id;
    else
      select coalesce(ws.title, w.title) into item_title
      from public.workshop_sessions ws
      left join public.workshops w on w.id = ws.workshop_id
      where ws.id = new.product_id;
    end if;

    perform public.issue_confirmed_payment_receipt(
      new.user_id, 'payment', new.id, coalesce(item_title, 'LexData training payment'),
      new.amount_cents::numeric / 100, new.currency, coalesce(new.updated_at, now()),
      coalesce(nullif(current_setting('app.default_document_jurisdiction', true), ''), 'PK'),
      jsonb_build_object('processor', 'stripe', 'stripe_checkout_session_id', new.stripe_checkout_session_id)
    );
  elsif new.status in ('refunded', 'cancelled') then
    update public.official_documents
      set status = 'void', revoked_at = now(), revocation_reason = 'Underlying payment was refunded or cancelled', updated_at = now()
    where document_type = 'receipt' and source_type = 'payment' and source_id = new.id and status = 'issued';
  end if;
  return new;
end;
$$;

drop trigger if exists create_receipt_after_payment_confirmation on public.payments;
create trigger create_receipt_after_payment_confirmation
after insert or update of status on public.payments
for each row execute function public.receipt_from_payment_row();

-- Registration schemas vary across the earlier MVP migrations, so these
-- trigger functions read NEW through jsonb and are installed only when the
-- corresponding table exists.
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

  if row_json->>'registration_status' = 'completed'
     and coalesce(old_json->>'registration_status', '') is distinct from 'completed' then
    workshop_id := nullif(row_json->>'workshop_id', '')::uuid;
    select title into workshop_title from public.workshops where id = workshop_id;
    perform public.prepare_completion_certificate(
      (row_json->>'user_id')::uuid, 'workshop_registration', new.id,
      coalesce(workshop_title, 'LexData workshop'), now(),
      coalesce(nullif(row_json->>'document_jurisdiction', ''), 'PK'),
      jsonb_build_object('completion_source', 'admin_marked_completed')
    );
  end if;
  return new;
end;
$$;

alter table public.workshop_registrations
  add column if not exists document_jurisdiction text not null default 'PK'
  check (document_jurisdiction in ('PK', 'SA', 'CN'));

drop trigger if exists create_documents_from_workshop_registration on public.workshop_registrations;
create trigger create_documents_from_workshop_registration
after update on public.workshop_registrations
for each row execute function public.receipt_from_workshop_registration();

-- Course enrollment and completion triggers are added conditionally because
-- some installations introduced course_enrollments outside schema.sql.
do $$
begin
  if to_regclass('public.course_enrollments') is not null then
    execute 'alter table public.course_enrollments add column if not exists document_jurisdiction text not null default ''PK'' check (document_jurisdiction in (''PK'', ''SA'', ''CN''))';
  end if;
end $$;

create or replace function public.receipt_from_course_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_json jsonb := to_jsonb(new);
  old_json jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  course_row record;
  published_count integer;
  completed_count integer;
begin
  if row_json->>'payment_status' = 'paid'
     and coalesce(old_json->>'payment_status', '') is distinct from 'paid' then
    select title, price_cents, currency into course_row
    from public.courses where id = (row_json->>'course_id')::uuid;
    if coalesce(course_row.price_cents, 0) > 0 then
      perform public.issue_confirmed_payment_receipt(
        (row_json->>'user_id')::uuid, 'course_enrollment', new.id,
        coalesce(course_row.title, 'LexData course'), course_row.price_cents::numeric / 100,
        coalesce(course_row.currency, 'USD'), now(),
        coalesce(nullif(row_json->>'document_jurisdiction', ''), 'PK'),
        jsonb_build_object('confirmation_method', 'admin_review')
      );
    end if;
  end if;

  -- If payment/approval happens after the participant already finished every
  -- lesson, prepare the certificate here as well as in the progress trigger.
  if row_json->>'enrollment_status' in ('approved', 'confirmed')
     and row_json->>'payment_status' in ('paid', 'waived') then
    select id, title into course_row
    from public.courses where id = (row_json->>'course_id')::uuid;
    select count(*) into published_count
    from public.lessons where course_id = course_row.id and is_published = true;
    select count(*) into completed_count
    from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
    where lp.user_id = (row_json->>'user_id')::uuid
      and l.course_id = course_row.id and l.is_published = true and lp.completed = true;

    if published_count > 0 and completed_count >= published_count then
      perform public.prepare_completion_certificate(
        (row_json->>'user_id')::uuid, 'course_enrollment', new.id,
        course_row.title, now(),
        coalesce(nullif(row_json->>'document_jurisdiction', ''), 'PK'),
        jsonb_build_object('completion_source', 'eligibility_rechecked_after_enrollment_update', 'lessons_completed', completed_count)
      );
    end if;
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.course_enrollments') is not null then
    execute 'drop trigger if exists create_receipt_from_course_enrollment on public.course_enrollments';
    execute 'create trigger create_receipt_from_course_enrollment after update on public.course_enrollments for each row execute function public.receipt_from_course_enrollment()';
  end if;
end $$;

create or replace function public.certificate_after_lesson_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_row record;
  enrollment_row record;
  published_count integer;
  completed_count integer;
begin
  if not new.completed then return new; end if;

  select c.id, c.title into course_row
  from public.lessons l join public.courses c on c.id = l.course_id
  where l.id = new.lesson_id;

  if course_row.id is null then return new; end if;

  execute 'select * from public.course_enrollments where user_id = $1 and course_id = $2 and enrollment_status in (''approved'', ''confirmed'') and payment_status in (''paid'', ''waived'') order by created_at desc limit 1'
    into enrollment_row using new.user_id, course_row.id;

  if enrollment_row.id is null then return new; end if;

  select count(*) into published_count from public.lessons where course_id = course_row.id and is_published = true;
  select count(*) into completed_count
  from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
  where lp.user_id = new.user_id and l.course_id = course_row.id and l.is_published = true and lp.completed = true;

  if published_count > 0 and completed_count >= published_count then
    perform public.prepare_completion_certificate(
      new.user_id, 'course_enrollment', enrollment_row.id, course_row.title, now(),
      coalesce(nullif(to_jsonb(enrollment_row)->>'document_jurisdiction', ''), 'PK'),
      jsonb_build_object('completion_source', 'all_published_lessons_completed', 'lessons_completed', completed_count)
    );
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.course_enrollments') is not null then
    execute 'drop trigger if exists prepare_certificate_after_lesson_completion on public.lesson_progress';
    execute 'create trigger prepare_certificate_after_lesson_completion after insert or update of completed on public.lesson_progress for each row execute function public.certificate_after_lesson_completion()';
  end if;
end $$;

-- Issuance helpers run from trusted triggers/service-role code only. Without
-- these revocations, a signed-in participant could call a SECURITY DEFINER
-- function through PostgREST and manufacture a document record.
revoke all on function public.document_number(text, text) from public, anon, authenticated;
revoke all on function public.issue_confirmed_payment_receipt(uuid, text, uuid, text, numeric, text, timestamptz, text, jsonb) from public, anon, authenticated;
revoke all on function public.prepare_completion_certificate(uuid, text, uuid, text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.document_number(text, text) to service_role;
grant execute on function public.issue_confirmed_payment_receipt(uuid, text, uuid, text, numeric, text, timestamptz, text, jsonb) to service_role;
grant execute on function public.prepare_completion_certificate(uuid, text, uuid, text, timestamptz, text, jsonb) to service_role;

notify pgrst, 'reload schema';
commit;
