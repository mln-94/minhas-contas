# Deploy — Minhas Contas

## 1. Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Copie `Project URL` e `anon public key` (Settings → API)
3. No SQL Editor, execute o arquivo `supabase/migrations/001_initial.sql` completo
4. Em Storage → New bucket: nome `receipts`, acesso **Private**

## 2. Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
```

## 3. Vercel

```bash
npm install -g vercel
vercel --prod
```

Ou conecte o repositório GitHub pelo painel do Vercel e adicione as env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4. Desenvolvimento local

```bash
cp .env.example .env
# edite .env com suas credenciais
npm install
npm run dev
```

## Estrutura de arquivos

```
src/
  types/index.ts          — tipos globais
  lib/
    supabase.ts           — cliente Supabase
    billUtils.ts          — lógica de datas, status, formatação
  hooks/
    useAuth.ts            — autenticação
    useBills.ts           — CRUD de contas e pagamentos
    useTheme.ts           — modo escuro persistente
  components/
    auth/AuthPage.tsx     — login / cadastro / recuperação de senha
    layout/Header.tsx     — cabeçalho com toggle de tema e logout
    layout/Navigation.tsx — navegação inferior
    dashboard/Dashboard.tsx
    bills/
      BillsPage.tsx       — lista com filtros e busca
      BillCard.tsx        — card individual
      BillForm.tsx        — modal de criação/edição
      PaymentModal.tsx    — modal de pagamento com upload de comprovante
      HistoryModal.tsx    — histórico de pagamentos
    shared/
      Modal.tsx           — wrapper de modal reutilizável
      ConfirmDialog.tsx   — diálogo de confirmação
```
