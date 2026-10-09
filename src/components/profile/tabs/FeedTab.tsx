import React from 'react';
import ActivityIcon from 'lucide-react/dist/esm/icons/activity';

interface FeedTabProps {
  isBanned?: boolean;
  ownMode?: boolean;
}

export const FeedTab: React.FC<FeedTabProps> = ({ isBanned, ownMode }) => {
  const showBannedNotice = !!isBanned && !!ownMode;

  return (
    <div className="flex flex-col gap-4">
      {showBannedNotice && (
        <div className="p-3.5 rounded-lg border border-[var(--feedback-error)]/30 bg-[var(--feedback-error)]/10 text-sm text-[var(--feedback-error)] font-medium">
          Conta suspensa. Você ainda pode navegar, mas não pode editar seu perfil.
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] mb-3">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)] m-0">
          Nenhuma atividade ainda
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1.5 m-0 max-w-sm">
          Publicações, registros de expedições e participações no fórum serão exibidos aqui.
        </p>
      </div>
    </div>
  );
};
