-- Fix: Add check to prevent users from redeeming promo codes multiple times
CREATE OR REPLACE FUNCTION public.redeem_access_code(code_text text, requesting_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  code_record RECORD;
  user_profile RECORD;
BEGIN
  -- Check if user has already redeemed a code
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE user_id = requesting_user_id;
  
  IF user_profile.promo_used IS NOT NULL THEN
    RETURN false;  -- User already redeemed a code
  END IF;

  -- Validate code exists and is active
  SELECT * INTO code_record 
  FROM public.access_codes 
  WHERE code = UPPER(code_text) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check max uses limit
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN false;
  END IF;
  
  -- Increment usage counter
  UPDATE public.access_codes 
  SET current_uses = current_uses + 1 
  WHERE id = code_record.id;
  
  -- Update user profile with access
  UPDATE public.profiles 
  SET has_access = true, 
      access_type = 'free_code',
      subscription_status = 'active',
      promo_used = UPPER(code_text)
  WHERE user_id = requesting_user_id;
  
  RETURN true;
END;
$$;