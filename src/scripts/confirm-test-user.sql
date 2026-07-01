-- ==============================================================================
-- CONFIRM ALL SUPABASE AUTH TEST USERS (BYPASS EMAIL CONFIRMATION)
-- Run this in your Supabase SQL Editor to instantly confirm all email signups!
-- ==============================================================================

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
