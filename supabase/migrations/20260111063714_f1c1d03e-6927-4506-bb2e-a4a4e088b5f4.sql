-- Add explicit DENY policies to subscriptions table for clarity and security
-- This makes it clear that only service-role backend functions can write to this table

-- Deny authenticated user inserts on subscriptions
CREATE POLICY "Deny user inserts on subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Deny authenticated user updates on subscriptions
CREATE POLICY "Deny user updates on subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Deny authenticated user deletes on subscriptions
CREATE POLICY "Deny user deletes on subscriptions"
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (false);