-- Allow public read access to profiles (for matching blog URLs by username)
CREATE POLICY "Public can view profiles with username"
ON public.profiles FOR SELECT
TO anon
USING (username IS NOT NULL);

-- Allow public read access to blog folders
CREATE POLICY "Public can view blog folders"
ON public.folders FOR SELECT
TO anon
USING (is_blog = true);

-- Allow public read access to published notes in blog folders
CREATE POLICY "Public can view published notes in blogs"
ON public.notes FOR SELECT
TO anon
USING (
  is_published = true 
  AND folder_id IN (SELECT id FROM public.folders WHERE is_blog = true)
);