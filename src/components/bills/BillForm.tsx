import { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Bill, Category, Frequency, BILL_COLORS, CATEGORY_LABELS, FREQUENCY_LABELS, MONTH_LABELS, WEEKDAY_LABELS } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Bill, 'id' | 'created_at' | 'user_id'>) => Promise<{ error: unknown }>;
  initial?: Bill | null;
}

const CATEGORIES: Category[] = [
  'moradia','servicos','assinaturas','saude','educacao','transporte','seguros','alimentacao','outros',
];

const FREQUENCIES: Frequency[] = ['weekly','monthly','quarterly','annual','one-time'];

export function BillForm({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [variableAmount, setVariableAmount] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [category, setCategory] = useState<Category>('outros');
  const [color, setColor] = useState(BILL_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // due_day fields
  const [monthlyDay, setMonthlyDay] = useState('5');
  const [weekday, setWeekday] = useState('1');
  const [annualMonth, setAnnualMonth] = useState('1');
  const [annualDay, setAnnualDay] = useState('1');
  const [oneTimeDate, setOneTimeDate] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setAmount(initial.amount > 0 ? String(initial.amount) : '');
      setVariableAmount(initial.variable_amount);
      setFrequency(initial.frequency);
      setCategory(initial.category);
      setColor(initial.color);
      setNotes(initial.notes || '');
      // Parse due_day
      if (initial.frequency === 'monthly' || initial.frequency === 'quarterly') {
        setMonthlyDay(initial.due_day);
      } else if (initial.frequency === 'weekly') {
        setWeekday(initial.due_day);
      } else if (initial.frequency === 'annual') {
        const [mm, dd] = initial.due_day.split('-');
        setAnnualMonth(String(parseInt(mm)));
        setAnnualDay(String(parseInt(dd)));
      } else if (initial.frequency === 'one-time') {
        setOneTimeDate(initial.due_day);
      }
    } else {
      setName(''); setAmount(''); setVariableAmount(false);
      setFrequency('monthly'); setCategory('outros'); setColor(BILL_COLORS[0]);
      setNotes(''); setMonthlyDay('5'); setWeekday('1');
      setAnnualMonth('1'); setAnnualDay('1'); setOneTimeDate('');
    }
    setError('');
  }, [open, initial]);

  function buildDueDay(): string {
    switch (frequency) {
      case 'monthly':
      case 'quarterly':
        return monthlyDay;
      case 'weekly':
        return weekday;
      case 'annual':
        return `${String(annualMonth).padStart(2, '0')}-${String(annualDay).padStart(2, '0')}`;
      case 'one-time':
        return oneTimeDate;
      default:
        return '1';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    if (frequency === 'one-time' && !oneTimeDate) { setError('Informe a data de vencimento'); return; }
    setLoading(true);
    setError('');
    const { error } = await onSave({
      name: name.trim(),
      amount: variableAmount ? 0 : parseFloat(amount.replace(',', '.')) || 0,
      variable_amount: variableAmount,
      frequency,
      due_day: buildDueDay(),
      category,
      color,
      notes: notes.trim(),
    });
    setLoading(false);
    if (error) setError((error as Error).message || 'Erro ao salvar');
    else onClose();
  }

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar conta' : 'Adicionar conta'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da conta *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Aluguel, Netflix..."
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>

        {/* Amount toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Valor</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-400">Valor variável</span>
              <div
                onClick={() => setVariableAmount((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${variableAmount ? 'bg-brand' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${variableAmount ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          {!variableAmount ? (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          ) : (
            <p className="text-slate-400 text-sm bg-slate-700/50 rounded-xl px-4 py-3">
              Valor será informado no momento do pagamento
            </p>
          )}
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Frequência *</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
            ))}
          </select>
        </div>

        {/* Due day — dynamic */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Vencimento *</label>
          {(frequency === 'monthly' || frequency === 'quarterly') && (
            <select
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
            >
              {days.map((d) => (
                <option key={d} value={String(d)}>Dia {d}</option>
              ))}
            </select>
          )}
          {frequency === 'weekly' && (
            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
            >
              {WEEKDAY_LABELS.map((d, i) => (
                <option key={i} value={String(i)}>{d}</option>
              ))}
            </select>
          )}
          {frequency === 'annual' && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={annualMonth}
                onChange={(e) => setAnnualMonth(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
              >
                {MONTH_LABELS.map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
              <select
                value={annualDay}
                onChange={(e) => setAnnualDay(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
              >
                {days.map((d) => (
                  <option key={d} value={String(d)}>Dia {d}</option>
                ))}
              </select>
            </div>
          )}
          {frequency === 'one-time' && (
            <input
              type="date"
              value={oneTimeDate}
              onChange={(e) => setOneTimeDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
            />
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoria *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {BILL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional..."
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-1 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-brand hover:bg-brand-400 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
