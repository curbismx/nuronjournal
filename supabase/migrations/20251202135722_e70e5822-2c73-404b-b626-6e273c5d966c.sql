-- Add audio_data column to notes table for storing recorded audio as base64
ALTER TABLE public.notes ADD COLUMN audio_data TEXT;