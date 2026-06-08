-- Policies on storage.objects for the carousel-images bucket.
-- Path convention: {user_id}/{carousel_id}/slide_{i}.png
DROP POLICY IF EXISTS "carousel-images: users read own" ON storage.objects;
DROP POLICY IF EXISTS "carousel-images: users insert own" ON storage.objects;
DROP POLICY IF EXISTS "carousel-images: users update own" ON storage.objects;
DROP POLICY IF EXISTS "carousel-images: users delete own" ON storage.objects;

CREATE POLICY "carousel-images: users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'carousel-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "carousel-images: users insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'carousel-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "carousel-images: users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'carousel-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "carousel-images: users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'carousel-images' AND (storage.foldername(name))[1] = auth.uid()::text);