begin;

alter table public.certificate_templates
  add column if not exists font_family text not null default 'serif',
  add column if not exists name_font_size integer not null default 64,
  add column if not exists program_font_size integer not null default 30,
  add column if not exists details_font_size integer not null default 13,
  add column if not exists completion_label text not null default 'Successfully completed';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'certificate_templates_font_family_check'
      and conrelid = 'public.certificate_templates'::regclass
  ) then
    alter table public.certificate_templates
      add constraint certificate_templates_font_family_check
      check (font_family in ('serif', 'sans'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'certificate_templates_font_sizes_check'
      and conrelid = 'public.certificate_templates'::regclass
  ) then
    alter table public.certificate_templates
      add constraint certificate_templates_font_sizes_check
      check (
        name_font_size between 24 and 100
        and program_font_size between 16 and 60
        and details_font_size between 8 and 28
      );
  end if;
end
$$;

create table if not exists public.document_format_profiles (
  id uuid primary key default uuid_generate_v4(),
  document_type text not null default 'receipt' check (document_type = 'receipt'),
  jurisdiction text not null check (jurisdiction in ('PK', 'SA', 'CN')),
  format_name text not null default 'Standard receipt',
  heading text not null default 'Official Payment Receipt',
  subheading text not null default 'PAID - PAYMENT CONFIRMED',
  primary_color text not null default '#0F172A' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#1D4ED8' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  font_family text not null default 'sans' check (font_family in ('sans', 'serif')),
  layout_style text not null default 'classic' check (layout_style in ('classic', 'modern', 'compact')),
  footer_text text not null default 'Thank you for your payment.',
  show_issuer_address boolean not null default true,
  show_tax_id boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, jurisdiction)
);

alter table public.document_format_profiles enable row level security;

drop policy if exists "admins manage document format profiles" on public.document_format_profiles;
create policy "admins manage document format profiles"
on public.document_format_profiles
for all using (public.is_admin()) with check (public.is_admin());

insert into public.document_format_profiles (
  jurisdiction, format_name, heading, subheading, primary_color, accent_color,
  font_family, layout_style, footer_text
)
values
  ('PK', 'Pakistan standard receipt', 'Official Payment Receipt', 'PAID - PAYMENT CONFIRMED', '#0F172A', '#1D4ED8', 'sans', 'classic', 'Thank you for your payment.'),
  ('SA', 'Saudi Arabia standard receipt', 'Payment Receipt', 'PAID - PAYMENT CONFIRMED', '#0F172A', '#047857', 'sans', 'classic', 'Thank you for your payment.'),
  ('CN', 'China standard receipt', 'Payment Receipt', 'PAID - PAYMENT CONFIRMED', '#0F172A', '#B91C1C', 'sans', 'classic', 'Thank you for your payment.')
on conflict (document_type, jurisdiction) do nothing;

-- Capture the active receipt format inside each newly issued receipt. Existing
-- documents retain their earlier metadata and therefore remain immutable.
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
  format_snapshot jsonb;
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

  select to_jsonb(format_row) - 'id' - 'updated_by' - 'created_at' - 'updated_at'
    into format_snapshot
  from public.document_format_profiles format_row
  where document_type = 'receipt' and jurisdiction = safe_jurisdiction;

  insert into public.official_documents (
    document_type, document_number, user_id, source_type, source_id,
    jurisdiction, status, recipient_name, recipient_email, title,
    amount, currency, payment_confirmed_at, issued_at, issuer_snapshot, metadata
  ) values (
    'receipt', public.document_number('receipt', safe_jurisdiction), p_user_id,
    p_source_type, p_source_id, safe_jurisdiction, 'issued',
    coalesce(nullif(trim(recipient.preferred_certificate_name), ''), nullif(trim(recipient.full_name), ''), recipient.email, 'Participant'),
    recipient.email, p_title, round(p_amount, 2), upper(p_currency), p_confirmed_at, now(),
    to_jsonb(issuer),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('receipt_format', coalesce(format_snapshot, '{}'::jsonb))
  )
  on conflict (document_type, source_type, source_id) do update
    set updated_at = now()
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.issue_confirmed_payment_receipt(uuid, text, uuid, text, numeric, text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.issue_confirmed_payment_receipt(uuid, text, uuid, text, numeric, text, timestamptz, text, jsonb) to service_role;

notify pgrst, 'reload schema';

commit;
