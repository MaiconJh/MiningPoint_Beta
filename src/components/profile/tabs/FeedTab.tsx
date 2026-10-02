import React from 'react';

interface FeedTabProps {
  isBanned?: boolean;
  ownMode?: boolean;
}

export const FeedTab: React.FC<FeedTabProps> = ({ isBanned, ownMode }) => {
  const showBannedNotice = !!isBanned && !!ownMode;

  return (
    <div className="py-2 space-y-3">
      {showBannedNotice && (
        <p className="text-sm text-[var(--feedback-error)] m-0 font-medium">
          Conta suspensa. Você ainda pode navegar, mas não pode editar seu perfil.
        </p>
      )}
      <p className="text-sm text-[var(--text-secondary)] m-0">
        Nenhuma atividade ainda
      </p>
    </div>
  );
};
