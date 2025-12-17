-- Add is_admin field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Optional: Set a specific user as admin (replace 'YOUR_USER_ID' with your actual user ID)
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID';

