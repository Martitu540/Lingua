-- Set a user as admin
-- Replace 'YOUR_USER_EMAIL' with your actual email address
-- Or replace 'YOUR_USER_ID' with your actual user UUID

-- Option 1: Set admin by email
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'YOUR_USER_EMAIL';

-- Option 2: Set admin by user ID (get your user ID from Supabase dashboard)
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = 'YOUR_USER_ID';

-- Verify the update
SELECT id, email, display_name, is_admin 
FROM profiles 
WHERE is_admin = TRUE;

