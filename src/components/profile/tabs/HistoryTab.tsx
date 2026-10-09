import React from 'react';
import CompassIcon from 'lucide-react/dist/esm/icons/compass';

export const HistoryTab: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] mb-3">
        <CompassIcon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)] m-0">
        Nenhuma expedição registrada
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1.5 m-0 max-w-sm">
        Registros de expedições de mineração e eventos da comunidade aparecerão nesta seção.
      </p>
    </div>
  );
};
