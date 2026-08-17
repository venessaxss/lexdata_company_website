begin;

alter table public.document_issuer_profiles
  add column if not exists receipt_stamp_url text,
  add column if not exists receipt_stamp_storage_path text,
  add column if not exists receipt_stamp_mime_type text,
  add column if not exists receipt_stamp_enabled boolean not null default false,
  add column if not exists receipt_stamp_updated_at timestamptz;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'issuer-assets',
  'issuer-assets',
  true,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';

commit;