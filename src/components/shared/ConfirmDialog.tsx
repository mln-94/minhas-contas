import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
  loading,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="p-5">
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmClass} disabled:opacity-60`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
