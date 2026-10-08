import React, { useEffect } from 'react';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';

export interface RevokeImpactModalProps {
  isOpen: boolean;
  sourceKindLabel: string;
  sourceName: string;
  userName: string;
  cascadingKindLabel: string;
  cascadingNames: string[];
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  saving: boolean;
}

export const RevokeImpactModal: React.FC<RevokeImpactModalProps> = ({
  isOpen,
  sourceKindLabel,
  sourceName,
  userName,
  cascadingKindLabel,
  cascadingNames,
  onConfirm,
  onCancel,
  saving,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, saving]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onCancel();
    }
  };

  const hasCascade = cascadingNames.length > 0;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-impact-title"
        className="w-full max-w-md rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-xl flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] flex items-center justify-center shrink-0 text-[var(--feedback-warning)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3
            id="revoke-impact-title"
            className="text-lg font-bold text-[var(--text-primary)] m-0 leading-snug"
          >
            Confirmar remoção
          </h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
          {hasCascade ? (
            <>
              Você está removendo {sourceKindLabel} «{sourceName}» de {userName}. Como {sourceKindLabel} concede {cascadingKindLabel} vinculados, os seguintes itens também serão removidos:
            </>
          ) : (
            <>
              Você está removendo {sourceKindLabel} «{sourceName}» de {userName}.
            </>
          )}
        </p>

        {hasCascade && (
          <ul className="list-disc list-inside max-h-[40vh] overflow-y-auto text-sm text-[var(--text-primary)] space-y-1 m-0 p-0">
            {cascadingNames.map((name, index) => (
              <li key={`${name}-${index}`} className="leading-snug">
                {name}
              </li>
            ))}
          </ul>
        )}

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
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--feedback-error)] text-[var(--text-on-primary)] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
};
