-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true);

-- Create RLS policies for note images
CREATE POLICY "Anyone can view note images"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Anyone can upload note images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes');

CREATE POLICY "Anyone can update their note images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'notes');

CREATE POLICY "Anyone can delete note images"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes');