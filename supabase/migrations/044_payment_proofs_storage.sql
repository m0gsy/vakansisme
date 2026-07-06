-- Create payment-proofs bucket for user-uploaded payment proof images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/jpg']
)
on conflict (id) do nothing;

-- RLS on storage objects
create policy "public read payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

create policy "auth users can upload payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.uid() is not null
  );

create policy "users can delete own payment proofs"
  on storage.objects for delete
  using (
    bucket_id = 'payment-proofs'
    and owner = auth.uid()
  );
