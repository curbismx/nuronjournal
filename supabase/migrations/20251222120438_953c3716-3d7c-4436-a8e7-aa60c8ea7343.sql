-- Add username to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add blog fields to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_blog BOOLEAN DEFAULT FALSE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS blog_slug TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS blog_name TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS blog_password TEXT;

-- Add published flag to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Create index for faster blog lookups
CREATE INDEX IF NOT EXISTS idx_folders_blog_slug ON folders(blog_slug) WHERE is_blog = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(is_published) WHERE is_published = TRUE;