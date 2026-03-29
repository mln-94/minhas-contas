import { useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Upload, ZoomIn, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Bill, Payment } from '../../types';
import { formatCurrency, formatPeriodLabel, compressImage } from '../../lib/billUtils';

interface Props {
  bill: Bill | null;
  open: boolean;
  payments: Payment[];
  onClose: () => void;
  onRemovePayment: (id: string) => Promise<{ error: unknown }>;
  onAttachReceipt: (id: string, file: File) => Promise<{ error: unknown }>;
  onRemoveReceipt: (id: string) => Promise<{ error: unknown }>;
  getReceiptUrl: (path: string) => Promise<string | null>;
}

function ReceiptThumb({
  payment, onView, onRemove, getReceiptUrl,
}: {
  payment: Payment;
  onView: (url: string) => void;
  onRemove: () => void;
  getReceiptUrl: (path: string) => Promise<string | null>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleView() {
    if (!payment.receipt_url) return;
    setLoading(true);
    const url = await getReceiptUrl(payment.receipt_url);
    setLoading(false);
    if (url) onView(url);
  }

  if (!payment.receipt_url) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={handleView}
        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <ZoomIn size={12} />}
        {payment.receipt_name || 'Comprovante'}
      </button>
      <button
        onClick={onRemove}
        className="text-slate-500 hover:text-red-400 transition-colors p-1"
        title="Remover comprovante"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function HistoryModal({
  bill, open, payments, onClose, onRemovePayment, onAttachReceipt, onRemoveReceipt, getReceiptUrl,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  async function handleAttach(paymentId: string, file: File) {
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo muito grande (máx. 10MB)'); return; }
    setUploadingId(paymentId);
    setError('');
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      const finalFile = new File([compressed], file.name, { type: compressed.type });
      const { error } = await onAttachReceipt(paymentId, finalFile);
      if (error) setError((error as Error).message || 'Erro ao anexar comprovante');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleRemovePayment() {
    if (!deleteConfirm) return;
    await onRemovePayment(deleteConfirm);
    setDeleteConfirm(null);
  }

  if (!bill) return null;

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Histórico — ${bill.name}`} maxWidth="max-w-lg">
        <div className="p-5 space-y-4">
          {payments.length > 0 && (
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Total pago</span>
              <span className="text-green-400 font-semibold">{formatCurrency(totalPaid)}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {payments.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">Nenhum pagamento registrado</p>
          )}

          <div className="space-y-3">
            {payments.map((payment) => {
              const paidDate = (() => {
                try { return format(parseISO(payment.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
                catch { return payment.paid_at; }
              })();

              return (
                <div key={payment.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-100 font-medium text-sm">
                        {formatPeriodLabel(payment.period_key, bill.frequency)}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{paidDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-semibold text-sm">
                        {payment.amount > 0 ? formatCurrency(payment.amount) : '—'}
                      </span>
                      <button
                        onClick={() => setDeleteConfirm(payment.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Remover pagamento"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Receipt */}
                  {payment.receipt_url ? (
                    <ReceiptThumb
                      payment={payment}
                      onView={setViewerUrl}
                      onRemove={async () => { await onRemoveReceipt(payment.id); }}
                      getReceiptUrl={getReceiptUrl}
                    />
                  ) : (
                    <div className="mt-2">
                      <input
                        ref={(el) => { fileRefs.current[payment.id] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAttach(payment.id, file);
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileRefs.current[payment.id]?.click()}
                        disabled={uploadingId === payment.id}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-brand-400 text-xs transition-colors"
                      >
                        {uploadingId === payment.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        Anexar comprovante
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Receipt viewer */}
      {viewerUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewerUrl(null)}
        >
          <button
            onClick={() => setViewerUrl(null)}
            className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-slate-700 rounded-xl p-2 transition-colors"
          >
            <X size={20} />
          </button>
          <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-16 text-white bg-slate-800 hover:bg-slate-700 rounded-xl p-2 transition-colors" onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={20} />
          </a>
          <img
            src={viewerUrl}
            alt="Comprovante"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleRemovePayment}
        title="Remover pagamento"
        message="Deseja remover este pagamento? O comprovante também será excluído."
        confirmLabel="Remover"
      />
    </>
  );
}
