import { useState, useRef } from 'react';
import { MoreVertical, CheckCircle2, Circle, Clock, AlertCircle, Upload, ZoomIn, X, Loader2, History, Pencil, Trash2 } from 'lucide-react';
import { BillWithStatus, Payment, CATEGORY_LABELS, FREQUENCY_LABELS } from '../../types';
import { formatCurrency, formatDueLabel, formatUrgencyLabel, compressImage } from '../../lib/billUtils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  bill: BillWithStatus;
  currentPayment: Payment | null;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
  onAttachReceipt: (file: File) => Promise<void>;
  onRemoveReceipt: () => Promise<void>;
  onViewReceipt: (path: string) => Promise<void>;
}

function StatusIcon({ status }: { status: BillWithStatus['status'] }) {
  switch (status) {
    case 'paid':     return <CheckCircle2 size={22} className="text-green-400" />;
    case 'overdue':  return <AlertCircle size={22} className="text-red-400" />;
    case 'due-soon': return <Clock size={22} className="text-yellow-400" />;
    default:         return <Circle size={22} className="text-slate-500" />;
  }
}

const STATUS_BADGE: Record<BillWithStatus['status'], string> = {
  paid:      'bg-green-500/15 text-green-400 border-green-500/30',
  overdue:   'bg-red-500/15 text-red-400 border-red-500/30',
  'due-soon':'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  future:    'bg-slate-600/40 text-slate-400 border-slate-600/40',
};

const STATUS_LABEL: Record<BillWithStatus['status'], string> = {
  paid:      'Pago',
  overdue:   'Vencido',
  'due-soon':'Vence em breve',
  future:    'Futuro',
};

export function BillCard({
  bill, currentPayment, onPay, onEdit, onDelete, onHistory,
  onAttachReceipt, onRemoveReceipt, onViewReceipt,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPaid = bill.status === 'paid';
  const paidDate = currentPayment?.paid_at
    ? (() => { try { return format(parseISO(currentPayment.paid_at), "dd/MM", { locale: ptBR }); } catch { return ''; } })()
    : '';

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploadingReceipt(true);
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      const final = new File([compressed], file.name, { type: compressed.type });
      await onAttachReceipt(final);
    } finally {
      setUploadingReceipt(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={`relative bg-slate-800 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 ${
      menuOpen ? 'z-50' : ''
    } ${
      bill.status === 'overdue' ? 'border-red-500/30' :
      bill.status === 'due-soon' ? 'border-yellow-500/30' :
      'border-slate-700/50 hover:border-slate-600'
    }`}>
      {/* Color bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: bill.color }} />

      <div className="pl-4 pr-4 py-4">
        <div className="flex items-start gap-3">
          {/* Status button */}
          <button
            onClick={!isPaid ? onPay : undefined}
            className={`mt-0.5 flex-shrink-0 transition-transform ${!isPaid ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <StatusIcon status={bill.status} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-slate-100 font-semibold text-sm leading-tight">{bill.name}</p>
              {bill.variable_amount && (
                <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 text-[10px] font-medium px-1.5 py-0.5 rounded-full">variável</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[bill.status]}`}>
                {STATUS_LABEL[bill.status]}
              </span>
              <span className="text-slate-500 text-[11px]">
                {formatUrgencyLabel(bill.status, bill.daysUntilDue)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-slate-500 text-xs">{CATEGORY_LABELS[bill.category]}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{FREQUENCY_LABELS[bill.frequency]}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{formatDueLabel(bill)}</span>
            </div>

            {/* Paid info */}
            {isPaid && currentPayment && (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className="text-green-400 text-sm font-semibold">
                  {currentPayment.amount > 0 ? formatCurrency(currentPayment.amount) : '—'}
                </span>
                {paidDate && (
                  <span className="text-slate-500 text-xs">pago em {paidDate}</span>
                )}
              </div>
            )}

            {/* Value (not paid) */}
            {!isPaid && (
              <div className="mt-1.5">
                {bill.variable_amount ? (
                  <span className="text-slate-400 text-sm">a definir</span>
                ) : (
                  <span className="text-slate-200 text-sm font-semibold">{formatCurrency(bill.amount)}</span>
                )}
              </div>
            )}

            {/* Receipt section */}
            {isPaid && currentPayment && (
              <div className="mt-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {currentPayment.receipt_url ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewReceipt(currentPayment.receipt_url!)}
                      className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <ZoomIn size={12} />
                      {currentPayment.receipt_name || 'Comprovante'}
                    </button>
                    <button
                      onClick={onRemoveReceipt}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remover comprovante"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingReceipt}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-brand-400 text-xs transition-colors"
                  >
                    {uploadingReceipt ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    Anexar comprovante
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              <MoreVertical size={17} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[160px]">
                  <button
                    onClick={() => { setMenuOpen(false); onHistory(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                  >
                    <History size={15} /> Ver histórico
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                  >
                    <Pencil size={15} /> Editar
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
