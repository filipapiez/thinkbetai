-- Fix 1: prevent access-code enumeration by removing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can check codes" ON public.access_codes;

-- Fix 2: prevent authenticated users from mutating Stripe customer records
-- Customer records should be written only by backend service-role processes (which bypass RLS)
DROP POLICY IF EXISTS "Deny regular user inserts on customers" ON public.customers;
DROP POLICY IF EXISTS "Deny regular user updates on customers" ON public.customers;
DROP POLICY IF EXISTS "Deny regular user deletes on customers" ON public.customers;

CREATE POLICY "Deny regular user inserts on customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny regular user updates on customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny regular user deletes on customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (false);
