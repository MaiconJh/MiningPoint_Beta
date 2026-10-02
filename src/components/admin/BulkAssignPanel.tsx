import React, { useState } from 'react';
import { Group } from '../../types/group';

interface BulkAssignPanelProps {
  groups: Group[];
  selectedCount: number;
  onConfirm: (groupId: string, mode: 'primary' | 'secondary') => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export const BulkAssignPanel: React.FC<BulkAssignPanelProps> = ({
  groups,
  selectedCount,
  onConfirm,
  onCancel,
  disabled = false,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [mode, setMode] = useState<'primary' | 'secondary'>('primary');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedGroupId || loading || disabled) return;
    setLoading(true);
    try {
      await onConfirm(selectedGroupId, mode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-lg space-y-4 max-w-md w-full">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <h4 className="font-semibold text-sm text-[var(--text-primary)] m-0">
          Atribuir grupo a {selectedCount} {selectedCount === 1 ? 'usuário' : 'usuários'}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || disabled}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <label htmlFor="bulk-group-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Grupo
          </label>
          <select
            id="bulk-group-select"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={loading || disabled}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Modo de atribuição
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="bulk-assign-mode"
                value="primary"
                checked={mode === 'primary'}
                onChange={() => setMode('primary')}
                disabled={loading || disabled}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-xs text-[var(--text-primary)]">
                Definir como grupo primário
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="bulk-assign-mode"
                value="secondary"
                checked={mode === 'secondary'}
                onChange={() => setMode('secondary')}
                disabled={loading || disabled}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-xs text-[var(--text-primary)]">
                Adicionar aos grupos secundários
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || disabled}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || disabled || !selectedGroupId}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Aplicando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
};
