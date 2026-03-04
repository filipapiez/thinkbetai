CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));