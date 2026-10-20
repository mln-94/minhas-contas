-- ============================================================
-- Minhas Contas — Migration 003: schema próprio (ADR-001)
-- Projeto Supabase único: bdqjumopwozcscrsypft
--
-- Move as tabelas do app de public para minhas_contas, sem perder dados
-- (ALTER TABLE ... SET SCHEMA mantém linhas, RLS, policies, índices e FKs).
-- Recria as funções apontando para o novo schema.
--
-- ORDEM DE EXECUÇÃO (ver docs/arquitetura/RUNBOOK-migracao-schemas.md no am-company):
--   1. Vercel (minhas-contas): criar VITE_SUPABASE_SCHEMA=minhas_contas (ainda sem redeploy)
--   2. Supabase: Settings → API → Exposed schemas: adicionar minhas_contas
--   3. Rodar ESTE arquivo no SQL Editor (é transacional: ou aplica tudo ou nada)
--   4. Vercel: Redeploy da produção
-- Rollback: rodar o bloco "ROLLBACK" no fim do arquivo e remover a variável na Vercel.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS minhas_contas;
GRANT USAGE ON SCHEMA minhas_contas TO anon, authenticated, service_role;

ALTER TABLE public.bills            SET SCHEMA minhas_contas;
ALTER TABLE public.payments         SET SCHEMA minhas_contas;
ALTER TABLE public.user_preferences SET SCHEMA minhas_contas;
ALTER TABLE public.profiles         SET SCHEMA minhas_contas;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA minhas_contas TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA minhas_contas TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA minhas_contas TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA minhas_contas GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA minhas_contas GRANT ALL ON TABLES TO service_role;

-- Corrige S7: só aceita pagamento de conta que pertence ao próprio usuário
DROP POLICY IF EXISTS "payments bill must be own (insert)" ON minhas_contas.payments;
CREATE POLICY "payments bill must be own (insert)" ON minhas_contas.payments
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bill_id IS NULL OR EXISTS (
    SELECT 1 FROM minhas_contas.bills b WHERE b.id = bill_id AND b.user_id = auth.uid()));
DROP POLICY IF EXISTS "payments bill must be own (update)" ON minhas_contas.payments;
CREATE POLICY "payments bill must be own (update)" ON minhas_contas.payments
  AS RESTRICTIVE FOR UPDATE TO authenticated
  WITH CHECK (bill_id IS NULL OR EXISTS (
    SELECT 1 FROM minhas_contas.bills b WHERE b.id = bill_id AND b.user_id = auth.uid()));

-- ─── Perfil automático no cadastro ───────────────────────────
-- O Auth é compartilhado pelos apps do projeto: só cria perfil para cadastros do
-- Minhas Contas. Os outros apps marcam seus usuários em app_metadata.app (que o usuário
-- não consegue alterar); sem marcação = cadastro do Minhas Contas.
CREATE OR REPLACE FUNCTION minhas_contas.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = minhas_contas, public
AS $$
BEGIN
  IF coalesce(NEW.raw_app_meta_data->>'app', 'minhas_contas') <> 'minhas_contas' THEN
    RETURN NEW;
  END IF;
  INSERT INTO minhas_contas.profiles (id, is_admin)
  VALUES (NEW.id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION minhas_contas.handle_new_user();

-- ─── Funções de admin ────────────────────────────────────────
CREATE OR REPLACE FUNCTION minhas_contas.get_users_stats()
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
SET search_path = minhas_contas, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM minhas_contas.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- só usuários do Minhas Contas (o Auth é compartilhado com outros apps)
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
  JOIN minhas_contas.profiles pr ON pr.id = u.id
  LEFT JOIN minhas_contas.bills b ON b.user_id = u.id
  LEFT JOIN minhas_contas.payments p ON p.user_id = u.id
  GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.banned_until;
END;
$$;

CREATE OR REPLACE FUNCTION minhas_contas.get_app_stats()
RETURNS TABLE (
  total_users    bigint,
  total_bills    bigint,
  total_payments bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = minhas_contas, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM minhas_contas.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM minhas_contas.profiles)::bigint,
    (SELECT COUNT(*) FROM minhas_contas.bills)::bigint,
    (SELECT COUNT(*) FROM minhas_contas.payments)::bigint;
END;
$$;

CREATE OR REPLACE FUNCTION minhas_contas.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = minhas_contas, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM minhas_contas.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- não permite apagar contas de outros apps do projeto
  IF NOT EXISTS (SELECT 1 FROM minhas_contas.profiles WHERE profiles.id = target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

CREATE OR REPLACE FUNCTION minhas_contas.admin_disable_user(target_id uuid, disable boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = minhas_contas, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM minhas_contas.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot disable your own account';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM minhas_contas.profiles WHERE profiles.id = target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE auth.users
  SET banned_until = CASE WHEN disable THEN '2099-01-01'::timestamptz ELSE NULL END
  WHERE id = target_id;
END;
$$;

-- Backfill: contas criadas antes da migration 002 não têm perfil. Neste momento todos
-- os usuários do Auth deste projeto são do Minhas Contas (Auge Club usa login próprio).
INSERT INTO minhas_contas.profiles (id, is_admin)
SELECT u.id, false FROM auth.users u
WHERE coalesce(u.raw_app_meta_data->>'app', 'minhas_contas') = 'minhas_contas'
ON CONFLICT (id) DO NOTHING;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA minhas_contas FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION minhas_contas.get_users_stats(), minhas_contas.get_app_stats(),
  minhas_contas.admin_delete_user(uuid), minhas_contas.admin_disable_user(uuid, boolean) TO authenticated;

-- As versões antigas em public ficam desativadas (não são apagadas) até o fim da validação.
REVOKE EXECUTE ON FUNCTION public.get_users_stats(), public.get_app_stats(),
  public.admin_delete_user(uuid), public.admin_disable_user(uuid, boolean) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- ROLLBACK (só se precisar voltar; rode manualmente)
-- ============================================================
-- BEGIN;
-- ALTER TABLE minhas_contas.bills            SET SCHEMA public;
-- ALTER TABLE minhas_contas.payments         SET SCHEMA public;
-- ALTER TABLE minhas_contas.user_preferences SET SCHEMA public;
-- ALTER TABLE minhas_contas.profiles         SET SCHEMA public;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- GRANT EXECUTE ON FUNCTION public.get_users_stats(), public.get_app_stats(),
--   public.admin_delete_user(uuid), public.admin_disable_user(uuid, boolean) TO authenticated;
-- NOTIFY pgrst, 'reload schema';
-- COMMIT;
-- e remova VITE_SUPABASE_SCHEMA na Vercel + Redeploy.
