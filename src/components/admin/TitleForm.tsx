import React, { useState } from 'react';
import { Title } from '../../types/title';
import { TitleFormData } from '../../lib/titles';
import { ChipStyle } from '../../types/chip';
import { ChipStyleEditor } from './ChipStyleEditor';
import {
  CollectibleCatalogFields,
  CollectibleCatalogFieldsValue,
} from './CollectibleCatalogFields';
import { LinkedCollectiblesPicker } from './LinkedCollectiblesPicker';

interface TitleFormProps {
  initialTitle?: Title | null;
  onSave: (data: TitleFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (titleId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const TitleForm: React.FC<TitleFormProps> = ({
  initialTitle,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [name, setName] = useState(initialTitle?.name || '');
  const [description, setDescription] = useState(initialTitle?.description || '');
  const [color, setColor] = useState(initialTitle?.color || '#8BD0EF');
  const [chipStyle, setChipStyle] = useState<ChipStyle | undefined>(
    initialTitle?.chipStyle
  );
  const [catalog, setCatalog] = useState<CollectibleCatalogFieldsValue>({
    rarityId: initialTitle?.rarityId ?? null,
    categoryId: initialTitle?.categoryId ?? null,
    originId: initialTitle?.originId ?? null,
    collectionId: initialTitle?.collectionId ?? null,
    order: initialTitle?.order ?? 0,
  });
  const [linkedBadgeIds, setLinkedBadgeIds] = useState<string[]>(
    initialTitle?.linkedBadgeIds || []
  );

  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('O nome do título é obrigatório.');
      return;
    }

    if (!description.trim()) {
      setLocalError('A descrição do título é obrigatória.');
      return;
    }

    if (!color.trim() || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.trim())) {
      setLocalError('Informe uma cor hexadecimal válida (ex: #8BD0EF ou #38404C).');
      return;
    }

    const payload: TitleFormData = {
      name: name.trim().slice(0, 40),
      description: description.trim().slice(0, 160),
      color: color.trim(),
      chipStyle: chipStyle ? chipStyle : undefined,
      rarityId: catalog.rarityId || null,
      categoryId: catalog.categoryId || null,
      originId: catalog.originId || null,
      collectionId: catalog.collectionId || null,
      order: typeof catalog.order === 'number' ? catalog.order : 0,
      linkedBadgeIds,
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving title:', err);
      setLocalError('Erro ao salvar o título. Tente novamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialTitle || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialTitle.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
          {initialTitle ? `Editar título: ${initialTitle.name}` : 'Novo título'}
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
          <label htmlFor="title-name" className="block text-sm font-semibold text-[var(--text-primary)]">
            Nome <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="title-name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Pioneiro, Filho da Profundeza"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">{name.length}/40 caracteres</span>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label htmlFor="title-desc" className="block text-sm font-semibold text-[var(--text-primary)]">
            Descrição <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <textarea
            id="title-desc"
            required
            rows={3}
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição sobre o significado ou obtenção do título"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm resize-none"
          />
          <span className="text-xs text-[var(--text-muted)]">{description.length}/160 caracteres</span>
        </div>

        {/* Cor */}
        <div className="space-y-2">
          <label htmlFor="title-color" className="block text-sm font-semibold text-[var(--text-primary)]">
            Cor do texto <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 p-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
            />
            <input
              id="title-color"
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

        {/* Aparência do chip */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <ChipStyleEditor
            value={chipStyle}
            fallbackColor={color}
            onChange={setChipStyle}
            labelName={name || 'Título'}
          />
        </div>

        {/* Catálogo */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <CollectibleCatalogFields value={catalog} onChange={setCatalog} />
        </div>

        {/* Insígnias vinculadas */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <LinkedCollectiblesPicker
            title="Insígnias vinculadas"
            targetKind="badge"
            selectedIds={linkedBadgeIds}
            onChange={setLinkedBadgeIds}
          />
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar título'}
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

          {initialTitle && onDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--feedback-error)] text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Excluir título
            </button>
          )}

          {initialTitle && onDelete && showDeleteConfirm && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)]">
              <span className="text-sm text-[var(--text-primary)]">
                Excluir «{initialTitle.name}»? Esta ação não pode ser desfeita.
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
