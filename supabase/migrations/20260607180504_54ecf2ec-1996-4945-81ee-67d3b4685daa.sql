
-- RLS para o bucket privado carousel-images: cada usuário acessa só sua pasta
CREATE POLICY "Users read own carousel images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'carousel-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own carousel images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'carousel-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own carousel images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'carousel-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own carousel images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'carousel-images' AND auth.uid()::text = (storage.foldername(name))[1]);
