-- Add trial_ends_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN trial_ends_at timestamp with time zone DEFAULT NULL;

-- Update the handle_new_user function to set 5-day trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, trial_ends_at)
  VALUES (NEW.id, NEW.email, now() + interval '5 days');
  RETURN NEW;
END;
$function$;