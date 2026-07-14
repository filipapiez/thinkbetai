-- Alert rules table
CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_enabled boolean NOT NULL DEFAULT true,
  name text NOT NULL,
  -- Filters (null = match anything)
  edge_types text[] DEFAULT NULL,       -- e.g. '{value,arb,middle}'
  sports text[] DEFAULT NULL,           -- matches opportunities.sport
  sport_keys text[] DEFAULT NULL,       -- matches opportunities.sport_key
  min_ev_pct numeric DEFAULT NULL,      -- applies to value opps
  min_profit_pct numeric DEFAULT NULL,  -- applies to arb opps (future)
  min_middle_size numeric DEFAULT NULL, -- applies to middle opps (future)
  -- Delivery
  discord_webhook_url text,
  email_to text,
  -- Throttle
  cooldown_seconds int NOT NULL DEFAULT 0,
  last_fired_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alert rules"
  ON public.alert_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: ping send-alerts on every genuinely new opportunity row
CREATE OR REPLACE FUNCTION public.notify_new_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-alerts',
    body := json_build_object('record', row_to_json(NEW))::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY')
    )::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send-alerts trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_new_opportunity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER opportunities_alert
  AFTER INSERT ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_opportunity();

-- Starter rules (disabled — enable + paste webhook to activate)
INSERT INTO public.alert_rules (name, edge_types, min_ev_pct, is_enabled)
VALUES ('High EV — all sports', ARRAY['value'], 4.0, false);

INSERT INTO public.alert_rules (name, edge_types, min_profit_pct, is_enabled)
VALUES ('Any arbitrage', ARRAY['arb'], 0.5, false);