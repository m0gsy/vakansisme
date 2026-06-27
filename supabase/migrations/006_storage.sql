-- Create media bucket (run this if bucket doesn't exist yet)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- RLS on storage objects
create policy "public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "auth users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    AND auth.uid() IS NOT NULL
  );

create policy "users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    AND owner = auth.uid()
  );
