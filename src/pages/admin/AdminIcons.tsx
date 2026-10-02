import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CustomIcon, CustomIconFormData } from '../../types/icon';
import {
  listCustomIcons,
  createCustomIcon,
  updateCustomIcon,
  deleteCustomIcon,
} from '../../lib/icons';
import { IconForm } from '../../components/admin/IconForm';
import { createCustomIconComponent } from '../../data/icons/iconRegistry';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../data/icons/categories';

type ViewMode = 'list' | 'create' | 'edit';

const ITEMS_PER_PAGE = 24;

export const AdminIcons: React.FC = () => {
  const { user } = useAuth();
  const [icons, setIcons] = useState<CustomIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIcon, setSelectedIcon] = useState<CustomIcon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listCustomIcons();
      setIcons(items);
    } catch (err) {
      console.error('Failed to load custom icons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedIcon(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (icon: CustomIcon) => {
    setSelectedIcon(icon);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedIcon(null);
    setFormError(null);
  };

  const handleSave = async (formData: CustomIconFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createCustomIcon(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedIcon) {
        await updateCustomIcon(selectedIcon.id, {
          name: formData.name,
          category: formData.category,
          tags: formData.tags,
        });
      }
      await loadData();
      setViewMode('list');
      setSelectedIcon(null);
    } catch (err: unknown) {
      console.error('Failed to save icon:', err);
      setFormError('Erro ao salvar o ícone customizado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (iconId: string) => {
    setFormError(null);
    const result = await deleteCustomIcon(iconId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir o ícone.');
      return;
    }
    await loadData();
    setViewMode('list');
    setSelectedIcon(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <IconForm
        initialIcon={selectedIcon}
        onSave={handleSave}
        onCancel={handleCancelForm}
        onDelete={viewMode === 'edit' ? handleDelete : undefined}
        saving={saving}
        inlineError={formError}
      />
    );
  }

  const totalPages = Math.ceil(icons.length / ITEMS_PER_PAGE) || 1;
  const paginatedIcons = icons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0">
            Ícones custom
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 m-0">
            Gerenciamento de ícones SVG customizados para insígnias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/insignias"
            className="px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] text-sm font-semibold transition-colors"
          >
            Ver insígnias
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
          >
            <span>Novo ícone</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {formError}
        </div>
      )}

      {/* Grid of icons */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            Carregando...
          </div>
        ) : icons.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            Nenhum ícone custom criado.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedIcons.map((icon) => {
                const IconComp = createCustomIconComponent(icon.svg, icon.viewBox);
                const categoryLabel =
                  CATEGORIES.find((c) => c.key === icon.category)?.labelPt || icon.category;

                return (
                  <div
                    key={icon.id}
                    className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] flex flex-col items-center justify-between text-center gap-3 hover:border-[var(--brand-primary)] transition-colors group"
                  >
                    {/* SVG Icon visual */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                      <IconComp className="w-8 h-8" />
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 w-full">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate m-0" title={icon.name}>
                        {icon.name}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-default)] text-[var(--text-muted)]">
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)] w-full justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(icon)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination if needed */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">
                  Página {currentPage} de {totalPages} ({icons.length} ícones)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
