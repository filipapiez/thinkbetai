-- Strip blanket UPDATE/INSERT from authenticated, keep row-level policies intact.
REVOKE UPDATE, INSERT ON public.profiles FROM authenticated;

-- Re-grant only safe, user-editable columns.
GRANT UPDATE (first_name, last_name) ON public.profiles TO authenticated;
GRANT INSERT (user_id, email, first_name, last_name) ON public.profiles TO authenticated;

-- SELECT/DELETE unchanged (DELETE is already denied by policy; SELECT is row-gated).
-- service_role retains full access for edge functions (stripe-webhook, check-subscription, etc.).
GRANT ALL ON public.profiles TO service_role;