-- Allow authenticated users to increment code usage (for redemption)
CREATE POLICY "Authenticated users can update code usage"
ON public.access_codes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);