-- Create payments table for tracking Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  type VARCHAR(50) NOT NULL, -- 'hearts', 'donation', 'premium', etc.
  status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert payments (via webhook)
CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

