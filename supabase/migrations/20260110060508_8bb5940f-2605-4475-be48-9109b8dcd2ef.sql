-- Create audit table for access code redemption attempts (rate limiting + logging)
CREATE TABLE IF NOT EXISTS public.access_code_redemption_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NULL,
  success boolean NOT NULL DEFAULT false,
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (default deny; we will add SELECT-only policies)
ALTER TABLE public.access_code_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view all attempts
CREATE POLICY "Admins can view access code redemption attempts"
ON public.access_code_redemption_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Users can view their own attempts (optional but safe)
CREATE POLICY "Users can view own access code redemption attempts"
ON public.access_code_redemption_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Helpful indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_access_code_redemption_attempts_user_time
  ON public.access_code_redemption_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_code_redemption_attempts_success_time
  ON public.access_code_redemption_attempts (success, created_at DESC);

-- Remove the SECURITY DEFINER RPC that was callable from the client
REVOKE ALL ON FUNCTION public.redeem_access_code(text, uuid) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.redeem_access_code(text, uuid);