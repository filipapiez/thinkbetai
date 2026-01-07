-- Drop the overly permissive policy
DROP POLICY "Authenticated users can update code usage" ON public.access_codes;

-- Create a security definer function to safely redeem codes
CREATE OR REPLACE FUNCTION public.redeem_access_code(code_text TEXT, requesting_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find the code
  SELECT * INTO code_record 
  FROM public.access_codes 
  WHERE code = UPPER(code_text) AND is_active = true;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check max uses
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN false;
  END IF;
  
  -- Update the code usage count
  UPDATE public.access_codes 
  SET current_uses = current_uses + 1 
  WHERE id = code_record.id;
  
  -- Update the user's profile
  UPDATE public.profiles 
  SET has_access = true, access_type = 'free_code'
  WHERE user_id = requesting_user_id;
  
  RETURN true;
END;
$$;