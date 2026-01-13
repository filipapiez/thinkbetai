-- Create user_parlays table to store parlay selections
CREATE TABLE public.user_parlays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  picks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint so each user has one parlay record
CREATE UNIQUE INDEX user_parlays_user_id_idx ON public.user_parlays(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_parlays ENABLE ROW LEVEL SECURITY;

-- Users can view their own parlays
CREATE POLICY "Users can view own parlays" 
ON public.user_parlays 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own parlays
CREATE POLICY "Users can insert own parlays" 
ON public.user_parlays 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own parlays
CREATE POLICY "Users can update own parlays" 
ON public.user_parlays 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own parlays
CREATE POLICY "Users can delete own parlays" 
ON public.user_parlays 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_parlays_updated_at
BEFORE UPDATE ON public.user_parlays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();