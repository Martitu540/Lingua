-- Verify admin RLS policies and user admin status
-- Run this to check if everything is set up correctly

-- 1. Check if you have admin users
SELECT 
  id, 
  email, 
  is_admin,
  display_name
FROM profiles 
WHERE is_admin = TRUE;

-- 2. Check current user's admin status (replace with your user ID)
-- SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();

-- 3. List all RLS policies on courses table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'courses';

-- 4. Test if admin policy exists
SELECT EXISTS (
  SELECT 1 
  FROM pg_policies 
  WHERE tablename = 'courses' 
  AND policyname = 'Admins can manage courses'
) AS admin_policy_exists;

-- 5. Check RLS is enabled on courses
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'courses';


