-- ============================================================
-- Minhas Contas — Migration inicial
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela de contas
CREATE TABLE IF NOT EXISTS public.bills (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users NOT NULL,
  name          text NOT NULL,
  amount        numeric(10,2) DEFAULT 0,
  variable_amount boolean DEFAULT false,
  frequency     text NOT NULL CHECK (frequency IN ('weekly','monthly','quarterly','annual','one-time')),
  due_day       text NOT NULL,
  category      text NOT NULL CHECK (category IN ('moradia','servicos','assinaturas','saude','educacao','transporte','seguros','alimentacao','outros')),
  notes         text DEFAULT '',
  color         text NOT NULL DEFAULT '#6366f1',
  created_at    timestamptz DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id       uuid REFERENCES public.bills ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users NOT NULL,
  period_key    text NOT NULL,
  paid_at       timestamptz DEFAULT now(),
  amount        numeric(10,2) DEFAULT 0,
  receipt_url   text,
  receipt_name  text,
  UNIQUE(bill_id, period_key)
);

-- Tabela de preferências do usuário (modo escuro etc)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id    uuid PRIMARY KEY REFERENCES auth.users,
  dark_mode  boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies para bills
CREATE POLICY "users can view own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own bills"
  ON public.bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own bills"
  ON public.bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own bills"
  ON public.bills FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para payments
CREATE POLICY "users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para user_preferences
CREATE POLICY "users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can upsert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Storage bucket "receipts"
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users can view own receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
