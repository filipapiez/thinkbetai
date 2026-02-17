
-- Persistent cache for odds API responses (survives edge function cold starts)
CREATE TABLE public.odds_cache (
  id text PRIMARY KEY, -- cache key (sport_key or match-level key)
  data jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for cleanup of expired entries
CREATE INDEX idx_odds_cache_expires_at ON public.odds_cache (expires_at);

-- Allow edge functions (service role) full access; no user access needed
ALTER TABLE public.odds_cache ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can access (edge functions use service role)
