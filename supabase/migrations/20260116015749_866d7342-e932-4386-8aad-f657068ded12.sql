-- Create active_bets table for tracking pending bets awaiting results
CREATE TABLE public.active_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  pick TEXT NOT NULL,
  pick_type TEXT NOT NULL DEFAULT 'moneyline', -- moneyline, spread, total, prop
  pick_value NUMERIC, -- spread/total line value if applicable
  odds INTEGER NOT NULL DEFAULT -110,
  confidence INTEGER NOT NULL DEFAULT 70,
  edge NUMERIC NOT NULL DEFAULT 0,
  game_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
  result TEXT, -- win, loss, push (set when game completes)
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.active_bets ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view active bets)
CREATE POLICY "Anyone can view active bets"
ON public.active_bets
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage active bets"
ON public.active_bets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_active_bets_status ON public.active_bets(status);
CREATE INDEX idx_active_bets_game_time ON public.active_bets(game_time);
CREATE INDEX idx_active_bets_game_id ON public.active_bets(game_id);

-- Create trigger for updated_at
CREATE TRIGGER update_active_bets_updated_at
BEFORE UPDATE ON public.active_bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();