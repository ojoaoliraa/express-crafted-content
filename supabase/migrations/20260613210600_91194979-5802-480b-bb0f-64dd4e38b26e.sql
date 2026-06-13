
-- Remove user-side INSERT on credit_transactions to prevent credit fraud
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;
REVOKE INSERT ON public.credit_transactions FROM anon, authenticated;
GRANT ALL ON public.credit_transactions TO service_role;

-- Lock down SECURITY DEFINER helper functions (used only by triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
