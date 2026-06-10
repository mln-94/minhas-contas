-- ============================================================
-- Minhas Contas — Migration 004: Login History (admin only)
-- ============================================================
-- Usa auth.audit_log_entries, preenchido automaticamente pelo
-- Supabase a cada login — zero código no lado do cliente.

CREATE OR REPLACE FUNCTION public.get_user_login_history(
  target_id   uuid,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  accessed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT ale.created_at AS accessed_at
  FROM auth.audit_log_entries ale
  WHERE (ale.payload->>'actor_id')::uuid = target_id
  ORDER BY ale.created_at DESC
  LIMIT limit_count;
END;
$$;
