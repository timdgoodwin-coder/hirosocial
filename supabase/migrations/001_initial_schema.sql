-- ============================================
-- Content Repurposer — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  language_preference TEXT NOT NULL DEFAULT 'US' CHECK (language_preference IN ('US', 'UK')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not credits — that's server-side only)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do anything (for server-side operations)
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 2. GENERATIONS TABLE
-- ============================================
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_title TEXT,
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'witty', 'authoritative', 'inspirational')),
  language TEXT NOT NULL DEFAULT 'US' CHECK (language IN ('US', 'UK')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generations
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do anything
CREATE POLICY "Service role has full access to generations"
  ON public.generations FOR ALL
  USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);

-- ============================================
-- 3. GENERATED POSTS TABLE
-- ============================================
CREATE TABLE public.generated_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'threads', 'instagram', 'linkedin')),
  variant INTEGER NOT NULL CHECK (variant IN (1, 2, 3)),
  content TEXT NOT NULL,
  character_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(generation_id, platform, variant)
);

-- Enable RLS
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- Users can read posts from their own generations
CREATE POLICY "Users can view own generated posts"
  ON public.generated_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.generations
      WHERE generations.id = generated_posts.generation_id
      AND generations.user_id = auth.uid()
    )
  );

-- Service role can do anything
CREATE POLICY "Service role has full access to generated_posts"
  ON public.generated_posts FOR ALL
  USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_generated_posts_generation_id ON public.generated_posts(generation_id);

-- ============================================
-- 4. CREDIT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  amount INTEGER NOT NULL,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do anything
CREATE POLICY "Service role has full access to credit_transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- ============================================
-- 5. AUTO-CREATE PROFILE ON SIGN UP
-- ============================================

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. AUTO-UPDATE updated_at ON PROFILES
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
