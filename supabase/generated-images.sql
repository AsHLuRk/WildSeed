-- Run once in Supabase SQL Editor to create private storage for generated ad concepts.
-- Only server routes use the service-role key to upload/read these objects. Public access
-- to a generated image is mediated by /api/generated-images/<uuid> for share previews.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wildseed-generated-images',
  'wildseed-generated-images',
  false,
  5242880,
  array['image/jpeg']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
