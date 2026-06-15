import { useState, useEffect } from 'react';
import {
  Users, Receipt, CreditCard, RefreshCw, Trash2, Ban, CheckCircle2,
  Loader2, ShieldCheck, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserStat {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_disabled: boolean;
  bills_count: number;
  payments_count: number;
}

interface AppStats {
  total_users: number;
  total_bills: number;
  total_payments: number;
}

interface LoginEntry {
  accessed_at: string;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return format(parseISO(iso), "dd/MM/yy 'às' HH:mm", { locale: ptBR }); }
  catch { return '—'; }
}

export function AdminPage() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserStat | null>(null);
  const [disableTarget, setDisableTarget] = useState<UserStat | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, LoginEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        supabase.rpc('get_users_stats'),
        supabase.rpc('get_app_stats'),
      ]);
      if (usersRes.error) throw usersRes.error;
      if (statsRes.error) throw statsRes.error;
      setUsers(usersRes.data ?? []);
      setStats(statsRes.data?.[0] ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('admin_delete_user', { target_id: deleteTarget.id });
    setActionLoading(false);
    setDeleteTarget(null);
    if (error) { setError(error.message); return; }
    load();
  }

  async function handleDisableToggle() {
    if (!disableTarget) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('admin_disable_user', {
      target_id: disableTarget.id,
      disable: !disableTarget.is_disabled,
    });
    setActionLoading(false);
    setDisableTarget(null);
    if (error) { setError(error.message); return; }
    load();
  }

  async function toggleHistory(userId: string) {
    if (historyUserId === userId) {
      setHistoryUserId(null);
      return;
    }
    setHistoryUserId(userId);
    if (historyData[userId]) return;

    setHistoryLoading(userId);
    const { data, error } = await supabase.rpc('get_user_login_history', {
      target_id: userId,
      limit_count: 20,
    });
    setHistoryLoading(null);
    if (!error) {
      setHistoryData((prev) => ({ ...prev, [userId]: data ?? [] }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Painel Admin</h1>
            <p className="text-slate-500 text-xs">Visão geral do sistema</p>
          </div>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Users size={16} />} label="Usuários" value={stats.total_users} color="text-brand-400" bg="bg-brand/10" />
          <StatCard icon={<CreditCard size={16} />} label="Contas" value={stats.total_bills} color="text-blue-400" bg="bg-blue-500/10" />
          <StatCard icon={<Receipt size={16} />} label="Pagamentos" value={stats.total_payments} color="text-green-400" bg="bg-green-500/10" />
        </div>
      )}

      {/* Users list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          Usuários cadastrados ({users.length})
        </h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}>
              <UserRow
                user={u}
                historyOpen={historyUserId === u.id}
                historyLoading={historyLoading === u.id}
                onDelete={() => setDeleteTarget(u)}
                onToggleDisable={() => setDisableTarget(u)}
                onToggleHistory={() => toggleHistory(u.id)}
              />
              {historyUserId === u.id && (
                <LoginHistoryPanel
                  entries={historyData[u.id]}
                  loading={historyLoading === u.id}
                />
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">Nenhum usuário encontrado.</p>
          )}
        </div>
      </div>

      {/* System info */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Informações do sistema</h2>
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50">
          <InfoRow label="Projeto Supabase" value="bdqjumopwozcscrsypft" mono />
          <InfoRow label="Região" value="South America (São Paulo)" />
          <InfoRow label="Domínio" value="contas.matheuslouro.com.br" />
          <InfoRow label="Ambiente" value="Produção" />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Excluir usuário"
        message={`Isso vai excluir permanentemente "${deleteTarget?.email}" e todos os dados. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
      />

      <ConfirmDialog
        open={!!disableTarget}
        onClose={() => setDisableTarget(null)}
        onConfirm={handleDisableToggle}
        loading={actionLoading}
        title={disableTarget?.is_disabled ? 'Reativar usuário' : 'Desativar usuário'}
        message={
          disableTarget?.is_disabled
            ? `Reativar o acesso de "${disableTarget?.email}"?`
            : `Desativar o acesso de "${disableTarget?.email}"? O usuário não conseguirá fazer login.`
        }
        confirmLabel={disableTarget?.is_disabled ? 'Reativar' : 'Desativar'}
        confirmClass={
          disableTarget?.is_disabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }
      />
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700/50">
      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <p className={`text-xl font-bold ${color} leading-tight`}>{value}</p>
      <p className="text-slate-400 text-xs mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function UserRow({
  user, historyOpen, historyLoading,
  onDelete, onToggleDisable, onToggleHistory,
}: {
  user: UserStat;
  historyOpen: boolean;
  historyLoading: boolean;
  onDelete: () => void;
  onToggleDisable: () => void;
  onToggleHistory: () => void;
}) {
  return (
    <div className={`bg-slate-800 rounded-xl border px-4 py-3 transition-colors ${
      user.is_disabled ? 'border-amber-500/30' : 'border-slate-700/50 hover:border-slate-600'
    } ${user.is_disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-100 text-sm font-medium truncate">{user.email}</p>
            {user.is_disabled && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                DESATIVADO
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Cadastro: {fmtDate(user.created_at)}
          </p>
          <p className="text-slate-500 text-xs">
            Último acesso: {fmtDate(user.last_sign_in_at)}
          </p>
          <p className="text-slate-600 text-xs mt-0.5">
            {user.bills_count} conta{user.bills_count !== 1 ? 's' : ''} · {user.payments_count} pagamento{user.payments_count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onToggleHistory}
            title="Ver histórico de acessos"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              historyOpen
                ? 'text-brand-400 bg-brand/10'
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            {historyLoading
              ? <Loader2 size={15} className="animate-spin" />
              : historyOpen
                ? <ChevronUp size={15} />
                : <ChevronDown size={15} />
            }
          </button>
          <button
            onClick={onToggleDisable}
            title={user.is_disabled ? 'Reativar' : 'Desativar'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              user.is_disabled
                ? 'text-green-400 hover:bg-green-400/10'
                : 'text-amber-400 hover:bg-amber-400/10'
            }`}
          >
            {user.is_disabled ? <CheckCircle2 size={16} /> : <Ban size={16} />}
          </button>
          <button
            onClick={onDelete}
            title="Excluir"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginHistoryPanel({ entries, loading }: { entries?: LoginEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-1 ml-2 bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
        <Loader2 size={14} className="text-slate-400 animate-spin" />
        <span className="text-slate-500 text-xs">Carregando histórico...</span>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="mt-1 ml-2 bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
        <Clock size={14} className="text-slate-500" />
        <span className="text-slate-500 text-xs">Nenhum acesso registrado.</span>
      </div>
    );
  }

  return (
    <div className="mt-1 ml-2 bg-slate-800/50 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-700/30 flex items-center gap-2">
        <Clock size={12} className="text-slate-400" />
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Histórico de acessos ({entries.length})
        </span>
      </div>
      <div className="divide-y divide-slate-700/20 max-h-48 overflow-y-auto">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center px-4 py-2">
            <span className="text-slate-300 text-xs">{fmtDate(entry.accessed_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-0.5 sm:gap-3">
      <span className="text-slate-400 text-xs sm:text-sm flex-shrink-0">{label}</span>
      <span className={`text-slate-200 sm:text-right truncate ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</span>
    </div>
  );
}
