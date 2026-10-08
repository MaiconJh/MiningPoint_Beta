import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../types/profile';
import {
  listBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  countUsersWithBadge,
  BadgeFormData,
} from '../../lib/badges';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { BadgeForm } from '../../components/admin/BadgeForm';
import { useAuth } from '../../context/AuthContext';
import { Chip } from '../../components/chip/Chip';
import { useRarities } from '../../hooks/useRarities';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminBadges: React.FC = () => {
  const { user } = useAuth();
  const { customIcons } = useCustomIcons();
  const { rarities } = useRarities();
  const rarityMap = React.useMemo(
    () => new Map(rarities.map((r) => [r.id, r])),
    [rarities]
  );
  const [badges, setBadges] = useState<Badge[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listBadges();
      setBadges(items);

      const countPromises = items.map(async (b) => {
        const count = await countUsersWithBadge(b.id);
        return [b.id, count] as const;
      });
      const resolvedCounts = await Promise.all(countPromises);
      const countMap: Record<string, number> = {};
      resolvedCounts.forEach(([id, c]) => {
        countMap[id] = c;
      });
      setCounts(countMap);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedBadge(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (badge: Badge) => {
    setSelectedBadge(badge);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedBadge(null);
    setFormError(null);
  };

  const handleSave = async (formData: BadgeFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createBadge(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedBadge) {
        await updateBadge(selectedBadge.id, formData);
      }
      await loadData();
      setViewMode('list');
      setSelectedBadge(null);
    } catch (err: unknown) {
      console.error('Failed to save badge:', err);
      setFormError('Erro ao salvar as informações da insígnia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (badgeId: string) => {
    setFormError(null);
    const result = await deleteBadge(badgeId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir a insígnia.');
      return;
    }
    await loadData();
    setViewMode('list');
    setSelectedBadge(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <BadgeForm
        initialBadge={selectedBadge}
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
            Insígnias
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/icones"
            className="px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] text-sm font-semibold transition-colors"
          >
            Ícones custom
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
          >
            <span>Nova insígnia</span>
          </button>
        </div>
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
        ) : badges.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma insígnia criada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="py-3 px-4 sm:px-6">Ícone</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Raridade</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Descrição</th>
                  <th className="py-3 px-4 text-center">Usuários</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {badges.map((badge) => {
                  const IconComponent = resolveIcon(badge.icon, customIcons);
                  const userCount = counts[badge.id] ?? 0;
                  const rarity = badge.rarityId ? rarityMap.get(badge.rarityId) : null;

                  return (
                    <tr
                      key={badge.id}
                      className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                    >
                      {/* Icon */}
                      <td className="py-4 px-4 sm:px-6 w-16">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                          {IconComponent && <IconComponent className="w-6 h-6" />}
                        </div>
                      </td>

                      {/* Name with link to detail */}
                      <td className="py-4 px-4 font-medium text-[var(--text-primary)]">
                        <Link
                          to={`/admin/insignias/${badge.id}`}
                          className="hover:text-[var(--brand-primary)] transition-colors hover:underline"
                        >
                          {badge.name}
                        </Link>
                      </td>

                      {/* Rarity */}
                      <td className="py-4 px-4">
                        {rarity ? (
                          <Chip label={rarity.label} color={rarity.color} />
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4 text-[var(--text-secondary)] hidden sm:table-cell max-w-xs md:max-w-md truncate">
                        {badge.description}
                      </td>

                      {/* Count of users */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                        {userCount}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            to={`/admin/insignias/${badge.id}`}
                            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                          >
                            Atribuir
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(badge)}
                            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
