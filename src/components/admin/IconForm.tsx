import React, { useState } from 'react';
import { CustomIcon, CustomIconFormData } from '../../types/icon';
import { CATEGORIES, CategoryKey } from '../../data/icons/categories';
import { SvgSourceInput } from './SvgSourceInput';
import { SvgPreview } from './SvgPreview';
import { sanitizeSvg } from '../../lib/svgSanitizer';

interface IconFormProps {
  initialIcon?: CustomIcon | null;
  onSave: (data: CustomIconFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (iconId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const IconForm: React.FC<IconFormProps> = ({
  initialIcon,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [name, setName] = useState(initialIcon?.name || '');
  const [category, setCategory] = useState<CategoryKey>(
    initialIcon?.category || 'general'
  );
  const [tagsInput, setTagsInput] = useState(
    initialIcon?.tags ? initialIcon.tags.join(', ') : ''
  );
  const [svgSource, setSvgSource] = useState(initialIcon?.svg || '');
  const [viewBox, setViewBox] = useState(initialIcon?.viewBox || '0 0 24 24');
  const [isSvgValid, setIsSvgValid] = useState(!!initialIcon?.svg);

  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!initialIcon;

  const handleSvgChange = (sanitizedSvg: string, vBox?: string, isValid = false) => {
    setSvgSource(sanitizedSvg);
    if (vBox) setViewBox(vBox);
    setIsSvgValid(isValid);
  };

  const validateTags = (input: string): { tags: string[]; error?: string } => {
    const rawTags = input
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (rawTags.length < 3 || rawTags.length > 6) {
      return {
        tags: [],
        error: 'Informe entre 3 e 6 tags separadas por vírgula.',
      };
    }

    for (const t of rawTags) {
      if (t.length < 2 || t.length > 24) {
        return {
          tags: [],
          error: `A tag "${t}" deve ter entre 2 e 24 caracteres.`,
        };
      }
      if (!/^[a-z0-9-]+$/.test(t)) {
        return {
          tags: [],
          error: `A tag "${t}" deve conter apenas letras minúsculas, números e hífens.`,
        };
      }
    }

    return { tags: rawTags };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('O nome do ícone é obrigatório.');
      return;
    }

    const { tags, error: tagError } = validateTags(tagsInput);
    if (tagError) {
      setLocalError(tagError);
      return;
    }

    let finalSvg = svgSource;
    let finalViewBox = viewBox;

    if (!isEditing) {
      const sanitized = sanitizeSvg(svgSource);
      if (!sanitized.ok) {
        setLocalError(sanitized.error);
        return;
      }
      finalSvg = sanitized.svg;
      finalViewBox = sanitized.viewBox;
    }

    const payload: CustomIconFormData = {
      name: name.trim().slice(0, 40),
      category,
      tags,
      svg: finalSvg,
      viewBox: finalViewBox,
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving icon:', err);
      setLocalError('Erro ao salvar o ícone. Tente novamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialIcon || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialIcon.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isFormValid =
    name.trim().length > 0 &&
    (isEditing || isSvgValid) &&
    tagsInput.trim().length > 0;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
          {initialIcon ? `Editar ícone: ${initialIcon.name}` : 'Novo ícone customizado'}
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
          <label htmlFor="icon-name" className="block text-sm font-semibold text-[var(--text-primary)]">
            Nome <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="icon-name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Picareta Cruzada, Lâmpada de Mina"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">{name.length}/40 caracteres</span>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label htmlFor="icon-category" className="block text-sm font-semibold text-[var(--text-primary)]">
            Categoria <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <select
            id="icon-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.labelPt}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="icon-tags" className="block text-sm font-semibold text-[var(--text-primary)]">
            Tags de busca (3 a 6 tags separadas por vírgula) <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="icon-tags"
            type="text"
            required
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Ex: mining, pickaxe, crystal, tools"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">
            Letras minúsculas e dígitos (2-24 caracteres cada)
          </span>
        </div>

        {/* SVG Source Input */}
        <SvgSourceInput
          value={svgSource}
          disabled={isEditing}
          onChange={handleSvgChange}
        />

        {/* Live SVG Preview */}
        {svgSource.trim() && (isSvgValid || isEditing) && (
          <SvgPreview svg={svgSource} viewBox={viewBox} name={name} />
        )}

        {/* Action buttons */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || deleting || !isFormValid}
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar ícone'}
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

          {initialIcon && onDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--feedback-error)] text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Excluir ícone
            </button>
          )}

          {initialIcon && onDelete && showDeleteConfirm && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)]">
              <span className="text-sm text-[var(--text-primary)]">
                Excluir «{initialIcon.name}»? Esta ação não pode ser desfeita.
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
