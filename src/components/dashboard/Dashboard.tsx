import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, TrendingDown, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { BillWithStatus, Payment } from '../../types';
import {
  formatCurrency,
  normalizeToMonthly,
  formatUrgencyLabel,
} from '../../lib/billUtils';

interface Props {
  bills: BillWithStatus[];
  payments: Payment[];
  onPayBill: (bill: BillWithStatus) => void;
  onGoToBills: () => void;
}

function MetricCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${color} leading-tight`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export function Dashboard({ bills, payments, onPayBill, onGoToBills }: Props) {
  const today = useMemo(() => new Date(), []);
  const monthLabel = format(today, "MMMM 'de' yyyy", { locale: ptBR });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const overdue = useMemo(() => bills.filter((b) => b.status === 'overdue'), [bills]);
  const dueSoon = useMemo(() => bills.filter((b) => b.status === 'due-soon'), [bills]);
  const paid = useMemo(() => bills.filter((b) => b.status === 'paid'), [bills]);
  const future = useMemo(() => bills.filter((b) => b.status === 'future'), [bills]);

  const totalMonthly = useMemo(
    () => bills.reduce((sum, b) => sum + normalizeToMonthly(b), 0),
    [bills]
  );

  const totalPaid = useMemo(() => {
    const currentMonth = format(today, 'yyyy-MM');
    return payments
      .filter((p) => p.period_key === currentMonth || p.period_key.startsWith(currentMonth))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments, today]);

  const totalOverdue = useMemo(
    () => overdue.reduce((sum, b) => sum + (b.variable_amount ? 0 : (b.amount || 0)), 0),
    [overdue]
  );

  const totalPending = useMemo(
    () => [...dueSoon, ...future].reduce((sum, b) => sum + (b.variable_amount ? 0 : (b.amount || 0)), 0),
    [dueSoon, future]
  );

  const paidPercent = bills.length > 0 ? Math.round((paid.length / bills.length) * 100) : 0;

  const allSorted = useMemo(
    () => [...bills].sort((a, b) => {
      const order = { overdue: 0, 'due-soon': 1, future: 2, paid: 3 };
      return order[a.status] - order[b.status];
    }),
    [bills]
  );

  const quickList = allSorted.filter((b) => b.status !== 'paid').slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Visão Geral</h1>
        <p className="text-slate-400 text-sm mt-0.5">{monthLabelCap}</p>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">
              {overdue.length} conta{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-red-400/70 text-xs mt-0.5">
              {overdue.map((b) => b.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total mensal" value={formatCurrency(totalMonthly)} sub="estimativa normalizada" color="text-slate-100" />
        <MetricCard label="Pago este mês" value={formatCurrency(totalPaid)} color="text-green-400" />
        <MetricCard label="Vencido" value={totalOverdue > 0 ? formatCurrency(totalOverdue) : '—'} sub={overdue.length > 0 ? `${overdue.length} conta${overdue.length > 1 ? 's' : ''}` : undefined} color="text-red-400" />
        <MetricCard label="A pagar" value={totalPending > 0 ? formatCurrency(totalPending) : '—'} sub={`${dueSoon.length + future.length} conta${dueSoon.length + future.length !== 1 ? 's' : ''}`} color="text-yellow-400" />
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Progresso do mês</span>
          <span className="text-sm font-bold text-brand-400">{paidPercent}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {paid.length} de {bills.length} conta{bills.length !== 1 ? 's' : ''} pagas
        </p>
      </div>

      {/* Due soon */}
      {dueSoon.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-yellow-400" />
            Vencendo em breve
          </h2>
          <div className="space-y-2">
            {dueSoon
              .sort((a, b) => (a.daysUntilDue ?? 99) - (b.daysUntilDue ?? 99))
              .map((bill) => (
                <div
                  key={bill.id}
                  className="bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-3 flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bill.color }} />
                    <div>
                      <p className="text-slate-100 text-sm font-medium">{bill.name}</p>
                      <p className="text-yellow-400 text-xs">{formatUrgencyLabel(bill.status, bill.daysUntilDue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm font-medium">
                      {bill.variable_amount ? '—' : formatCurrency(bill.amount)}
                    </span>
                    <button
                      onClick={() => onPayBill(bill)}
                      className="bg-brand hover:bg-brand-400 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick list */}
      {quickList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Todas as contas</h2>
            <button
              onClick={onGoToBills}
              className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
            >
              Ver todas <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {quickList.map((bill) => (
              <div
                key={bill.id}
                className="bg-slate-800 rounded-xl border border-slate-700/50 px-4 py-3 flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bill.color }} />
                  <div>
                    <p className="text-slate-100 text-sm font-medium">{bill.name}</p>
                    <p className={`text-xs ${
                      bill.status === 'overdue' ? 'text-red-400' :
                      bill.status === 'due-soon' ? 'text-yellow-400' : 'text-slate-400'
                    }`}>
                      {formatUrgencyLabel(bill.status, bill.daysUntilDue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm">
                    {bill.variable_amount && bill.status !== 'paid' ? '—' : formatCurrency(bill.amount)}
                  </span>
                  <button
                    onClick={() => onPayBill(bill)}
                    className="bg-brand hover:bg-brand-400 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bills.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 size={48} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma conta cadastrada ainda.</p>
          <button onClick={onGoToBills} className="mt-3 text-brand-400 hover:text-brand-300 text-sm transition-colors">
            Adicionar primeira conta →
          </button>
        </div>
      )}

      {bills.length > 0 && overdue.length === 0 && dueSoon.length === 0 && paid.length === bills.length && (
        <div className="text-center py-8">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Tudo pago!</p>
          <p className="text-slate-400 text-sm mt-1">Você está em dia com suas contas.</p>
        </div>
      )}
    </div>
  );
}
