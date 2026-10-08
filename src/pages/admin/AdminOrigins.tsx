import React, { useState } from 'react';
import { Origin } from '../../types/origin';
import {
  createOrigin,
  updateOrigin,
  deleteOrigin,
  OriginFormData,
} from '../../lib/origins';
import { useOrigins } from '../../hooks/useOrigins';
import { OriginForm } from '../../components/admin/OriginForm';
import { useAuth } from '../../context/AuthContext';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminOrigins: React.FC = () => {
  const { user } = useAuth();
  const { origins, loading, reload } = useOrigins();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setSelectedOrigin(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (origin: Origin) => {
    setSelectedOrigin(origin);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedOrigin(null);
    setFormError(null);
  };

  const handleSave = async (formData: OriginFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createOrigin(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedOrigin) {
        await updateOrigin(selectedOrigin.id, formData);
      }
      await reload();
      setViewMode('list');
      setSelectedOrigin(null);
    } catch (err: unknown) {
      console.error('Failed to save origin:', err);
      setFormError('Erro ao salvar as informações da origem.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (originId: string) => {
    setFormError(null);
    const result = await deleteOrigin(originId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir a origem.');
      return;
    }
    await reload();
    setViewMode('list');
    setSelectedOrigin(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <OriginForm
        initialOrigin={selectedOrigin}
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
            Origens
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <span>Nova origem</span>
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
        ) : origins.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma origem criada
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
                {origins.map((origin) => (
                  <tr
                    key={origin.id}
                    className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                  >
                    {/* Name */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-[var(--text-primary)]">
                      {origin.name}
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 text-[var(--text-secondary)] hidden sm:table-cell max-w-xs md:max-w-md truncate">
                      {origin.description}
                    </td>

                    {/* Order */}
                    <td className="py-4 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                      {origin.order}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(origin)}
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
