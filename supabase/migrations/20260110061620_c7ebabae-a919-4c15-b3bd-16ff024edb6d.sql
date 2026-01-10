-- Add explicit DENY policies for non-admin users on access_codes table
-- This prevents any potential exploitation by ensuring regular users cannot modify access codes

-- Drop existing policies first if they exist (to recreate properly)
DROP POLICY IF EXISTS "Deny non-admin inserts on access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "Deny non-admin updates on access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "Deny non-admin deletes on access_codes" ON public.access_codes;

-- Create explicit DENY policies for non-admin users
CREATE POLICY "Deny non-admin inserts on access_codes"
ON public.access_codes
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny non-admin updates on access_codes"
ON public.access_codes
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny non-admin deletes on access_codes"
ON public.access_codes
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));