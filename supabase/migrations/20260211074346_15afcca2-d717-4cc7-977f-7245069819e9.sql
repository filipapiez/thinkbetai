-- Add restrictive DELETE policy on profiles table - deny all deletes
CREATE POLICY "Deny deletes on profiles"
  ON public.profiles
  FOR DELETE
  USING (false);