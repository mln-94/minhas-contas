-- ============================================================
-- Minhas Contas — Migration 004: Activity Logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  page       text NOT NULL CHECK (page IN ('dashboard', 'bills')),
  visited_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_visited_at_idx
  ON public.user_activity_logs (user_id, visited_at DESC);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── get_user_activity(target_id) ─── (admin only) ──────────
CREATE OR REPLACE FUNCTION public.get_user_activity(
  target_id    uuid,
  limit_count  int DEFAULT 30
)
RETURNS TABLE (
  page        text,
  visited_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT al.page, al.visited_at
  FROM public.user_activity_logs al
  WHERE al.user_id = target_id
  ORDER BY al.visited_at DESC
  LIMIT limit_count;
END;
$$;
