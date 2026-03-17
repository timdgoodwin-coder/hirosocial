-- ============================================
-- Migration 002: Stripe & increment_credits RPC
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. increment_credits RPC
-- Called by the Stripe webhook to safely add
-- credits to a user's balance.
-- Uses service_role so it bypasses RLS.
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    credits = credits + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.increment_credits(UUID, INTEGER) TO service_role;
