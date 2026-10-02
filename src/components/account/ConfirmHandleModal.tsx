import React from 'react';
import AlertTriangleIcon from 'lucide-react/dist/esm/icons/alert-triangle';

interface ConfirmHandleModalProps {
  isOpen: boolean;
  currentHandle: string | null;
  newHandle: string;
  onConfirm: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export const ConfirmHandleModal: React.FC<ConfirmHandleModalProps> = ({
  isOpen,
  currentHandle,
  newHandle,
  onConfirm,
  onCancel,
  saving = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
            <AlertTriangleIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 leading-snug">
            Confirmar redefinição de @nick
          </h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
          Você está prestes a trocar <strong className="text-[var(--text-primary)] font-mono">@{currentHandle || 'nenhum'}</strong> por{' '}
          <strong className="text-[var(--brand-primary)] font-mono">@{newHandle}</strong>. Esta é a sua única redefinição pessoal — depois
          disso, só um administrador poderá alterar novamente.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Aplicando...' : 'Confirmar redefinição'}
          </button>
        </div>
      </div>
    </div>
  );
};
