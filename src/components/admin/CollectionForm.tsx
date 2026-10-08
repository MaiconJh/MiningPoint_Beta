import React, { useState } from 'react';
import { NamedCollection, CollectionFormData } from '../../types/collection';

interface CollectionFormProps {
  initialCollection?: NamedCollection | null;
  onSave: (data: CollectionFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (collectionId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  initialCollection,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [name, setName] = useState(initialCollection?.name || '');
  const [description, setDescription] = useState(initialCollection?.description || '');
  const [order, setOrder] = useState<number>(initialCollection?.order ?? 0);

  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('O nome da coleção é obrigatório.');
      return;
    }

    if (!description.trim()) {
      setLocalError('A descrição da coleção é obrigatória.');
      return;
    }

    if (order < 0 || order > 999) {
      setLocalError('A ordem deve ser um número entre 0 e 999.');
      return;
    }

    const payload: CollectionFormData = {
      name: name.trim().slice(0, 40),
      description: description.trim().slice(0, 160),
      order: Number(order) || 0,
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving collection:', err);
      setLocalError('Erro ao salvar a coleção. Tente novamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialCollection || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialCollection.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
          {initialCollection ? `Editar coleção: ${initialCollection.name}` : 'Nova coleção'}
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
        {/* Nome */}
        <div className="space-y-2">
          <label htmlFor="collection-name" className="block text-sm font-semibold text-[var(--text-primary)]">
            Nome <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="collection-name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Série Mineral, Fundadores"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">{name.length}/40 caracteres</span>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label htmlFor="collection-desc" className="block text-sm font-semibold text-[var(--text-primary)]">
            Descrição <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <textarea
            id="collection-desc"
            required
            rows={3}
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição da coleção"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm resize-none"
          />
          <span className="text-xs text-[var(--text-muted)]">{description.length}/160 caracteres</span>
        </div>

        {/* Ordem */}
        <div className="space-y-2">
          <label htmlFor="collection-order" className="block text-sm font-semibold text-[var(--text-primary)]">
            Ordem (0–999) <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="collection-order"
            type="number"
            min={0}
            max={999}
            required
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full font-mono px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">Determina a ordem de exibição</span>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar coleção'}
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

          {initialCollection && onDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--feedback-error)] text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Excluir coleção
            </button>
          )}

          {initialCollection && onDelete && showDeleteConfirm && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)]">
              <span className="text-sm text-[var(--text-primary)]">
                Excluir «{initialCollection.name}»? Esta ação não pode ser desfeita.
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
