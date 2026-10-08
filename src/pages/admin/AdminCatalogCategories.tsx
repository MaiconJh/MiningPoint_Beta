import React, { useState } from 'react';
import { CatalogCategory } from '../../types/catalogCategory';
import {
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  CatalogCategoryFormData,
} from '../../lib/catalogCategories';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { CatalogCategoryForm } from '../../components/admin/CatalogCategoryForm';
import { useAuth } from '../../context/AuthContext';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminCatalogCategories: React.FC = () => {
  const { user } = useAuth();
  const { categories, loading, reload } = useCatalogCategories();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (category: CatalogCategory) => {
    setSelectedCategory(category);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedCategory(null);
    setFormError(null);
  };

  const handleSave = async (formData: CatalogCategoryFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createCatalogCategory(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedCategory) {
        await updateCatalogCategory(selectedCategory.id, formData);
      }
      await reload();
      setViewMode('list');
      setSelectedCategory(null);
    } catch (err: unknown) {
      console.error('Failed to save category:', err);
      setFormError('Erro ao salvar as informações da categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    setFormError(null);
    const result = await deleteCatalogCategory(categoryId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir a categoria.');
      return;
    }
    await reload();
    setViewMode('list');
    setSelectedCategory(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <CatalogCategoryForm
        initialCategory={selectedCategory}
        onSave={handleSave}
        onCancel={handleCancelForm}
        onDelete={viewMode === 'edit' ? handleDelete : undefined}
        saving={saving}
        inlineError={formError}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0">
            Categorias
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <span>Nova categoria</span>
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {formError}
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Carregando...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma categoria criada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="py-3 px-4 sm:px-6">Nome</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Descrição</th>
                  <th className="py-3 px-4 text-center">Ordem</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                  >
                    {/* Name */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-[var(--text-primary)]">
                      {category.name}
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 text-[var(--text-secondary)] hidden sm:table-cell max-w-xs md:max-w-md truncate">
                      {category.description}
                    </td>

                    {/* Order */}
                    <td className="py-4 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                      {category.order}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        className="px-2.5 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
