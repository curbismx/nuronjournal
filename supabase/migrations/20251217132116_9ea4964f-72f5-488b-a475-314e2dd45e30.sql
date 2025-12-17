-- Create folders table
CREATE TABLE public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_view TEXT DEFAULT 'collapsed' CHECK (default_view IN ('collapsed', 'compact')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to notes table
ALTER TABLE public.notes ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create default "Notes" folder for new users
CREATE OR REPLACE FUNCTION public.create_default_folder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.folders (user_id, name, default_view)
  VALUES (NEW.id, 'Notes', 'collapsed');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create default folder when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_folder ON auth.users;
CREATE TRIGGER on_auth_user_created_folder
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_folder();