-- Create table for historical qualified bets
CREATE TABLE public.historical_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sport TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  pick TEXT NOT NULL,
  odds INTEGER NOT NULL,
  confidence INTEGER NOT NULL,
  edge DECIMAL(4,1) NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historical_bets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view historical bets (public data for marketing)
CREATE POLICY "Anyone can view historical bets"
ON public.historical_bets
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert historical bets"
ON public.historical_bets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update historical bets"
ON public.historical_bets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete historical bets"
ON public.historical_bets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_historical_bets_date ON public.historical_bets(date DESC);
CREATE INDEX idx_historical_bets_sport ON public.historical_bets(sport);