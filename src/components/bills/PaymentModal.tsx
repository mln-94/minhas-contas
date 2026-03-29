import { useState, useRef, useCallback } from 'react';
import { Upload, X, ZoomIn, Loader2, CheckCircle2, CreditCard } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { BillWithStatus } from '../../types';
import { formatCurrency, getCurrentPeriodKey, formatPeriodLabel, compressImage } from '../../lib/billUtils';

interface Props {
  bill: BillWithStatus | null;
  open: boolean;
  onClose: () => void;
  onPay: (billId: string, periodKey: string, amount: number, receipt?: File | null) => Promise<{ error: unknown }>;
}

export function PaymentModal({ bill, open, onClose, onPay }: Props) {
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setAmount('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setError('');
    setLoading(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  const periodKey = bill ? getCurrentPeriodKey(bill) : '';
  const periodLabel = bill ? formatPeriodLabel(periodKey, bill.frequency) : '';

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo muito grande (máx. 10MB)'); return; }
    setError('');
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      const finalFile = new File([compressed], file.name, { type: compressed.type });
      setReceiptFile(finalFile);
      if (file.type !== 'application/pdf') {
        setReceiptPreview(URL.createObjectURL(compressed));
      } else {
        setReceiptPreview(null);
      }
    } catch {
      setReceiptFile(file);
      setReceiptPreview(null);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function submit(withReceipt: boolean) {
    if (!bill) return;
    const val = parseFloat(amount.replace(',', '.'));
    if (bill.variable_amount && (isNaN(val) || val <= 0)) {
      setError('Informe o valor pago');
      return;
    }
    const finalAmount = bill.variable_amount ? val : bill.amount;
    setLoading(true);
    setError('');
    const { error } = await onPay(bill.id, periodKey, finalAmount, withReceipt ? receiptFile : null);
    setLoading(false);
    if (error) setError((error as Error).message || 'Erro ao registrar pagamento');
    else handleClose();
  }

  if (!bill) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Registrar pagamento" maxWidth="max-w-md">
      <div className="p-5 space-y-4">
        {/* Bill info */}
        <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bill.color + '30', border: `2px solid ${bill.color}` }}>
            <CreditCard size={18} style={{ color: bill.color }} />
          </div>
          <div>
            <p className="text-slate-100 font-medium text-sm">{bill.name}</p>
            <p className="text-slate-400 text-xs">{periodLabel}</p>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Valor pago</label>
          {!bill.variable_amount ? (
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-300 text-sm">
              {formatCurrency(bill.amount)} <span className="text-slate-500 text-xs ml-1">(fixo)</span>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={bill.amount > 0 ? String(bill.amount) : '0,00'}
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          )}
        </div>

        {/* Receipt upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Comprovante (opcional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {!receiptFile ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand-400/5 transition-all"
            >
              <Upload size={22} className="text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Clique ou arraste o arquivo</p>
              <p className="text-slate-500 text-xs mt-1">JPG, PNG ou PDF — máx. 10MB</p>
            </div>
          ) : (
            <div className="border border-slate-600 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm truncate max-w-[80%]">{receiptFile.name}</span>
                <button
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-slate-400 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              {receiptPreview && (
                <img
                  src={receiptPreview}
                  alt="Preview"
                  className="w-full max-h-40 object-cover rounded-lg cursor-pointer"
                  onClick={() => window.open(receiptPreview, '_blank')}
                />
              )}
              {receiptFile.type === 'application/pdf' && (
                <p className="text-slate-400 text-xs text-center py-4">📄 PDF pronto para envio</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => submit(true)}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-400 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
            Confirmar pagamento
          </button>
          {!bill.variable_amount && (
            <button
              onClick={() => submit(false)}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              Pagar sem comprovante
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full text-slate-400 hover:text-slate-200 py-2 text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
