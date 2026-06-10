
-- Restrictive policies on user_roles to guarantee only admins can modify roles
CREATE POLICY "Restrict role inserts to admins"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restrict role updates to admins"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restrict role deletes to admins"
ON public.user_roles AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicit admin-only policies on odds_cache to document intent
CREATE POLICY "Admins can read odds_cache"
ON public.odds_cache
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can write odds_cache"
ON public.odds_cache
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicit deny for non-admins on admin_picks (RESTRICTIVE doc policy)
CREATE POLICY "Only admins may access admin_picks"
ON public.admin_picks AS RESTRICTIVE
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
