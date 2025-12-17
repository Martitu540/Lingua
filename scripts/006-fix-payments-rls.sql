-- Fix RLS policies for payments table to allow admin access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;

-- Allow admins to view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Allow users to view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to insert payments (via webhook)
CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

