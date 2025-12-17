-- Fix RLS policies to allow admins to manage courses, units, lessons, and exercises
-- This script adds INSERT, UPDATE, and DELETE policies for admins

-- COURSES: Allow admins full access
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

-- UNITS: Allow admins full access
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

-- LESSONS: Allow admins full access
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

-- EXERCISES: Allow admins full access
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

-- LANGUAGES: Allow admins full access (in case they need to manage languages)
DROP POLICY IF EXISTS "Admins can manage languages" ON languages;
CREATE POLICY "Admins can manage languages" ON languages
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

-- ACHIEVEMENTS: Allow admins full access
DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements" ON achievements
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

