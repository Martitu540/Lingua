-- Quick fix: Set yourself as admin and verify RLS policies
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- Step 1: Make sure is_admin column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 2: Set yourself as admin (replace with your email)
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 3: Verify you're now an admin
SELECT id, email, is_admin, display_name 
FROM profiles 
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 4: Drop and recreate admin policies for courses (to ensure they work)
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Step 5: Same for units
DROP POLICY IF EXISTS "Admins can manage units" ON units;
CREATE POLICY "Admins can manage units" ON units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Step 6: Same for lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Step 7: Same for exercises
DROP POLICY IF EXISTS "Admins can manage exercises" ON exercises;
CREATE POLICY "Admins can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Step 8: Verify policies were created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('courses', 'units', 'lessons', 'exercises')
AND policyname LIKE '%Admins can manage%'
ORDER BY tablename, policyname;


