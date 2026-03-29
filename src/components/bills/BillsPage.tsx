import { useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Bill, BillWithStatus, Payment, BillStatus, Frequency, FREQUENCY_LABELS } from '../../types';
import { buildBillsWithStatus, sortBills, getCurrentPeriodKey } from '../../lib/billUtils';
import { BillCard } from './BillCard';
import { BillForm } from './BillForm';
import { PaymentModal } from './PaymentModal';
import { HistoryModal } from './HistoryModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface Props {
  bills: Bill[];
  payments: Payment[];
  onAddBill: (data: Omit<Bill, 'id' | 'created_at' | 'user_id'>) => Promise<{ error: unknown }>;
  onUpdateBill: (id: string, data: Partial<Bill>) => Promise<{ error: unknown }>;
  onDeleteBill: (id: string) => Promise<{ error: unknown }>;
  onPay: (billId: string, periodKey: string, amount: number, receipt?: File | null) => Promise<{ error: unknown }>;
  onRemovePayment: (id: string) => Promise<{ error: unknown }>;
  onAttachReceipt: (id: string, file: File) => Promise<{ error: unknown }>;
  onRemoveReceipt: (id: string) => Promise<{ error: unknown }>;
  billsPayments: (billId: string) => Payment[];
  getReceiptUrl: (path: string) => Promise<string | null>;
}

const STATUS_FILTERS: { value: BillStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'due-soon', label: 'Em breve' },
  { value: 'future', label: 'Futuro' },
  { value: 'paid', label: 'Pago' },
];

const FREQ_FILTERS: { value: Frequency | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'weekly', label: FREQUENCY_LABELS.weekly },
  { value: 'monthly', label: FREQUENCY_LABELS.monthly },
  { value: 'quarterly', label: FREQUENCY_LABELS.quarterly },
  { value: 'annual', label: FREQUENCY_LABELS.annual },
  { value: 'one-time', label: FREQUENCY_LABELS['one-time'] },
];

export function BillsPage({
  bills, payments,
  onAddBill, onUpdateBill, onDeleteBill, onPay, onRemovePayment,
  onAttachReceipt, onRemoveReceipt, billsPayments, getReceiptUrl,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [freqFilter, setFreqFilter] = useState<Frequency | 'all'>('all');

  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [payBill, setPayBill] = useState<BillWithStatus | null>(null);
  const [historyBill, setHistoryBill] = useState<Bill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const billsWithStatus = useMemo(
    () => sortBills(buildBillsWithStatus(bills, payments)),
    [bills, payments]
  );

  const filtered = useMemo(() => {
    return billsWithStatus.filter((b) => {
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchFreq = freqFilter === 'all' || b.frequency === freqFilter;
      return matchSearch && matchStatus && matchFreq;
    });
  }, [billsWithStatus, search, statusFilter, freqFilter]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    await onDeleteBill(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
  }

  async function handleViewReceipt(path: string) {
    const url = await getReceiptUrl(path);
    if (url) setViewerUrl(url);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Contas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conta..."
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-brand text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FREQ_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFreqFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                freqFilter === f.value
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-slate-500 text-xs">
        {filtered.length} de {bills.length} conta{bills.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((bill) => {
          const currentPayment = bill.currentPayment;
          const histPayments = billsPayments(bill.id);
          const paidPayment = currentPayment ?? histPayments.find(
            (p) => p.period_key === getCurrentPeriodKey(bill)
          ) ?? null;

          return (
            <BillCard
              key={bill.id}
              bill={bill}
              currentPayment={paidPayment}
              onPay={() => setPayBill(bill)}
              onEdit={() => setEditBill(bill)}
              onDelete={() => setDeleteId(bill.id)}
              onHistory={() => setHistoryBill(bill)}
              onAttachReceipt={async (file) => {
                if (paidPayment) await onAttachReceipt(paidPayment.id, file);
              }}
              onRemoveReceipt={async () => {
                if (paidPayment) await onRemoveReceipt(paidPayment.id);
              }}
              onViewReceipt={handleViewReceipt}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            {bills.length === 0 ? 'Nenhuma conta cadastrada.' : 'Nenhuma conta encontrada.'}
          </p>
          {bills.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-brand-400 hover:text-brand-300 text-sm transition-colors"
            >
              + Adicionar primeira conta
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <BillForm
        open={showForm || !!editBill}
        onClose={() => { setShowForm(false); setEditBill(null); }}
        onSave={async (data) => {
          if (editBill) return onUpdateBill(editBill.id, data);
          return onAddBill(data);
        }}
        initial={editBill}
      />

      <PaymentModal
        bill={payBill}
        open={!!payBill}
        onClose={() => setPayBill(null)}
        onPay={onPay}
      />

      <HistoryModal
        bill={historyBill}
        open={!!historyBill}
        payments={historyBill ? billsPayments(historyBill.id) : []}
        onClose={() => setHistoryBill(null)}
        onRemovePayment={onRemovePayment}
        onAttachReceipt={onAttachReceipt}
        onRemoveReceipt={onRemoveReceipt}
        getReceiptUrl={getReceiptUrl}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir conta"
        message="Deseja excluir esta conta? Todos os pagamentos associados também serão removidos."
        confirmLabel="Excluir"
        loading={deleteLoading}
      />

      {/* Receipt viewer fullscreen */}
      {viewerUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewerUrl(null)}
        >
          <button onClick={() => setViewerUrl(null)} className="absolute top-4 right-4 text-white bg-slate-800 rounded-xl p-2 hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
          <img
            src={viewerUrl}
            alt="Comprovante"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
