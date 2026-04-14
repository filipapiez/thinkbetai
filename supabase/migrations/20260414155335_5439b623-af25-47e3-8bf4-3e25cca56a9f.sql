-- Add referred_by column to profiles table to track affiliate referrals
ALTER TABLE public.profiles ADD COLUMN referred_by TEXT DEFAULT NULL;