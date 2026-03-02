-- Add phone column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update RLS and other settings if necessary
-- (Already handled by generic policies usually)
