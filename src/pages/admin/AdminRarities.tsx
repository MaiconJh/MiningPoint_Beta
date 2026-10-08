import React, { useState } from 'react';
import { Rarity } from '../../types/rarity';
import {
  createRarity,
  updateRarity,
  deleteRarity,
  RarityFormData,
} from '../../lib/rarities';
import { useRarities } from '../../hooks/useRarities';
import { RarityForm } from '../../components/admin/RarityForm';
import { useAuth } from '../../context/AuthContext';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminRarities: React.FC = () => {
  const { user } = useAuth();
  const { rarities, loading, reload } = useRarities();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setSelectedRarity(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (rarity: Rarity) => {
    setSelectedRarity(rarity);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedRarity(null);
    setFormError(null);
  };

  const handleSave = async (formData: RarityFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createRarity(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedRarity) {
        await updateRarity(selectedRarity.id, formData);
      }
      await reload();
      setViewMode('list');
      setSelectedRarity(null);
    } catch (err: unknown) {
      console.error('Failed to save rarity:', err);
      setFormError('Erro ao salvar as informações da raridade.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rarityId: string) => {
    setFormError(null);
    const result = await deleteRarity(rarityId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir a raridade.');
      return;
    }
    await reload();
    setViewMode('list');
    setSelectedRarity(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <RarityForm
        initialRarity={selectedRarity}
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
            Raridades
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <span>Nova raridade</span>
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
        ) : rarities.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma raridade criada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="py-3 px-4 sm:px-6">Cor</th>
                  <th className="py-3 px-4">Rótulo</th>
                  <th className="py-3 px-4 text-center">Ordem</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {rarities.map((rarity) => (
                  <tr
                    key={rarity.id}
                    className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                  >
                    {/* Color Swatch */}
                    <td className="py-4 px-4 sm:px-6 w-16">
                      <div
                        className="w-8 h-8 rounded-lg border border-[var(--border-default)] shadow-xs"
                        style={{ backgroundColor: rarity.color }}
                        title={rarity.color}
                      />
                    </td>

                    {/* Label */}
                    <td className="py-4 px-4 font-medium text-[var(--text-primary)]">
                      {rarity.label}
                    </td>

                    {/* Order */}
                    <td className="py-4 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                      {rarity.order}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rarity)}
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
