
CREATE TABLE public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  page_type text NOT NULL,
  sport text,
  entity_id text,
  title text NOT NULL,
  meta_description text,
  h1 text,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'upcoming',
  game_date date,
  last_data_hash text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_seo_pages_type ON public.seo_pages(page_type);
CREATE INDEX idx_seo_pages_status ON public.seo_pages(status);
CREATE INDEX idx_seo_pages_game_date ON public.seo_pages(game_date);
CREATE INDEX idx_seo_pages_sport ON public.seo_pages(sport);

GRANT SELECT ON public.seo_pages TO anon, authenticated;
GRANT ALL ON public.seo_pages TO service_role;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SEO pages" ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage SEO pages" ON public.seo_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.seo_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  pages_created int NOT NULL DEFAULT 0,
  pages_updated int NOT NULL DEFAULT 0,
  pages_failed int NOT NULL DEFAULT 0,
  errors_json jsonb,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_seo_run_logs_started ON public.seo_run_logs(started_at DESC);

GRANT SELECT ON public.seo_run_logs TO authenticated;
GRANT ALL ON public.seo_run_logs TO service_role;
ALTER TABLE public.seo_run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view run logs" ON public.seo_run_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.seo_page_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  page_type text,
  reason text NOT NULL,
  payload_json jsonb,
  run_id uuid REFERENCES public.seo_run_logs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_seo_page_errors_created ON public.seo_page_errors(created_at DESC);

GRANT SELECT ON public.seo_page_errors TO authenticated;
GRANT ALL ON public.seo_page_errors TO service_role;
ALTER TABLE public.seo_page_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view page errors" ON public.seo_page_errors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role));
