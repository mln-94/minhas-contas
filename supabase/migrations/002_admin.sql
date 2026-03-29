-- ============================================================
-- Minhas Contas — Migration 002: Admin
-- ============================================================

-- ─── profiles table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  is_admin   boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ─── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES (NEW.id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── get_users_stats() ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_users_stats()
RETURNS TABLE (
  id              uuid,
  email           text,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  is_disabled     boolean,
  bills_count     bigint,
  payments_count  bigint
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
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    (u.banned_until IS NOT NULL AND u.banned_until > now()) AS is_disabled,
    COUNT(DISTINCT b.id) AS bills_count,
    COUNT(DISTINCT p.id) AS payments_count
  FROM auth.users u
  LEFT JOIN public.bills b ON b.user_id = u.id
  LEFT JOIN public.payments p ON p.user_id = u.id
  GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.banned_until;
END;
$$;

-- ─── get_app_stats() ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_app_stats()
RETURNS TABLE (
  total_users    bigint,
  total_bills    bigint,
  total_payments bigint
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
  SELECT
    (SELECT COUNT(*) FROM auth.users)::bigint,
    (SELECT COUNT(*) FROM public.bills)::bigint,
    (SELECT COUNT(*) FROM public.payments)::bigint;
END;
$$;

-- ─── admin_delete_user(target_id) ───────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
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

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- ─── admin_disable_user(target_id, disable) ─────────────────
CREATE OR REPLACE FUNCTION public.admin_disable_user(target_id uuid, disable boolean)
RETURNS void
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

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot disable your own account';
  END IF;

  UPDATE auth.users
  SET banned_until = CASE WHEN disable THEN '2099-01-01'::timestamptz ELSE NULL END
  WHERE id = target_id;
END;
$$;
