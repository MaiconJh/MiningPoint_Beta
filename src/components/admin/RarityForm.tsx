import React, { useState } from 'react';
import { Rarity, RarityFormData } from '../../types/rarity';
import { EffectStack } from '../../lib/effects/types';
import { EffectStackEditor } from './EffectStackEditor';

interface RarityFormProps {
  initialRarity?: Rarity | null;
  onSave: (data: RarityFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (rarityId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const RarityForm: React.FC<RarityFormProps> = ({
  initialRarity,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [label, setLabel] = useState(initialRarity?.label || '');
  const [color, setColor] = useState(initialRarity?.color || '#8BD0EF');
  const [order, setOrder] = useState<number>(initialRarity?.order ?? 0);
  const [theme, setTheme] = useState<EffectStack | undefined>(initialRarity?.theme);

  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!label.trim()) {
      setLocalError('O rótulo da raridade é obrigatório.');
      return;
    }

    if (!color.trim() || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.trim())) {
      setLocalError('Informe uma cor hexadecimal válida (ex: #8BD0EF ou #FBBF24).');
      return;
    }

    if (order < 0 || order > 999) {
      setLocalError('A ordem deve ser um número entre 0 e 999.');
      return;
    }

    const payload: RarityFormData = {
      label: label.trim().slice(0, 40),
      color: color.trim(),
      order: Number(order) || 0,
      theme: theme ?? undefined,
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving rarity:', err);
      setLocalError('Erro ao salvar a raridade. Tente novamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialRarity || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialRarity.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
          {initialRarity ? `Editar raridade: ${initialRarity.label}` : 'Nova raridade'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || deleting}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      {(localError || inlineError) && (
        <div className="mb-6 p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {localError || inlineError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rótulo */}
        <div className="space-y-2">
          <label htmlFor="rarity-label" className="block text-sm font-semibold text-[var(--text-primary)]">
            Rótulo <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="rarity-label"
            type="text"
            required
            maxLength={40}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Comum, Rara, Lendária"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">{label.length}/40 caracteres</span>
        </div>

        {/* Cor */}
        <div className="space-y-2">
          <label htmlFor="rarity-color" className="block text-sm font-semibold text-[var(--text-primary)]">
            Cor <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 p-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
            />
            <input
              id="rarity-color"
              type="text"
              required
              maxLength={7}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#8BD0EF"
              className="w-36 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
        </div>

        {/* Efeitos visuais */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <EffectStackEditor
            value={theme}
            onChange={setTheme}
            labelName={label || 'Raridade'}
          />
        </div>

        {/* Ordem */}
        <div className="space-y-2">
          <label htmlFor="rarity-order" className="block text-sm font-semibold text-[var(--text-primary)]">
            Ordem (0–999) <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="rarity-order"
            type="number"
            min={0}
            max={999}
            required
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full font-mono px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">Determina a hierarquia de ordenação</span>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar raridade'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {initialRarity && onDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--feedback-error)] text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Excluir raridade
            </button>
          )}

          {initialRarity && onDelete && showDeleteConfirm && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)]">
              <span className="text-sm text-[var(--text-primary)]">
                Excluir «{initialRarity.label}»? Esta ação não pode ser desfeita.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-md bg-[var(--feedback-error)] text-[var(--text-on-primary)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
