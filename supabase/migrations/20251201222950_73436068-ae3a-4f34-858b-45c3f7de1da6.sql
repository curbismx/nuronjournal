-- Add secure RLS policies for note-images storage bucket

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Authenticated users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Public can view images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-images');