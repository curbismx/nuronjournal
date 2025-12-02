-- Create the storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true);

-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read recordings (public bucket)
CREATE POLICY "Public can view recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-recordings');

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);