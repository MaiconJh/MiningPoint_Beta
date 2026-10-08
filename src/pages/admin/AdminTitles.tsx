import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Title } from '../../types/title';
import {
  listTitles,
  createTitle,
  updateTitle,
  deleteTitle,
  countUsersWithTitle,
  TitleFormData,
} from '../../lib/titles';
import { TitleForm } from '../../components/admin/TitleForm';
import { useAuth } from '../../context/AuthContext';
import { Chip } from '../../components/chip/Chip';
import { useRarities } from '../../hooks/useRarities';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { useOrigins } from '../../hooks/useOrigins';
import { useCollections } from '../../hooks/useCollections';
import { CollectibleFiltersBar } from '../../components/admin/CollectibleFiltersBar';
import {
  parseFiltersFromUrl,
  filtersToSearchParams,
  applyFilters,
  groupCollectibles,
  DEFAULT_FILTERS,
  CollectibleListFilters,
} from '../../lib/collectibleFilters';

type ViewMode = 'list' | 'create' | 'edit';

export const AdminTitles: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { rarities } = useRarities();
  const { categories } = useCatalogCategories();
  const { origins } = useOrigins();
  const { collections } = useCollections();

  const rarityMap = useMemo(
    () => new Map(rarities.map((r) => [r.id, r])),
    [rarities]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const originMap = useMemo(
    () => new Map(origins.map((o) => [o.id, o])),
    [origins]
  );
  const collectionMap = useMemo(
    () => new Map(collections.map((col) => [col.id, col])),
    [collections]
  );

  const [titles, setTitles] = useState<Title[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtros derivados da URL
  const filters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams]
  );

  const handleFiltersChange = useCallback(
    (next: CollectibleListFilters) => {
      const nextParams = filtersToSearchParams(next);
      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Itens filtrados e agrupados
  const filteredTitles = useMemo(
    () => applyFilters(titles, filters),
    [titles, filters]
  );

  const groupedTitles = useMemo(
    () =>
      groupCollectibles(filteredTitles, filters.groupBy, {
        rarities: rarityMap,
        categories: categoryMap,
        origins: originMap,
        collections: collectionMap,
      }),
    [filteredTitles, filters.groupBy, rarityMap, categoryMap, originMap, collectionMap]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listTitles();
      setTitles(items);

      const countPromises = items.map(async (t) => {
        const count = await countUsersWithTitle(t.id);
        return [t.id, count] as const;
      });
      const resolvedCounts = await Promise.all(countPromises);
      const countMap: Record<string, number> = {};
      resolvedCounts.forEach(([id, c]) => {
        countMap[id] = c;
      });
      setCounts(countMap);
    } catch (err) {
      console.error('Failed to load titles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedTitle(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (title: Title) => {
    setSelectedTitle(title);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedTitle(null);
    setFormError(null);
  };

  const handleSave = async (formData: TitleFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'create') {
        await createTitle(formData, user?.uid || 'admin');
      } else if (viewMode === 'edit' && selectedTitle) {
        await updateTitle(selectedTitle.id, formData);
      }
      await loadData();
      await refreshProfile();
      setViewMode('list');
      setSelectedTitle(null);
    } catch (err: unknown) {
      console.error('Failed to save title:', err);
      setFormError('Erro ao salvar as informações do título.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (titleId: string) => {
    setFormError(null);
    const result = await deleteTitle(titleId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir o título.');
      return;
    }
    await loadData();
    setViewMode('list');
    setSelectedTitle(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <TitleForm
        initialTitle={selectedTitle}
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
            Títulos
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <span>Novo título</span>
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {formError}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <CollectibleFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
        totalFiltered={filteredTitles.length}
        totalItems={titles.length}
      />

      {/* Catalog Table(s) */}
      {loading ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm p-8 text-center text-sm text-[var(--text-muted)]">
          Carregando...
        </div>
      ) : titles.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm p-8 text-center text-sm text-[var(--text-secondary)]">
          Nenhum título criado
        </div>
      ) : filteredTitles.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm p-8 text-center text-sm text-[var(--text-secondary)]">
          Nenhum título corresponde aos filtros aplicados.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTitles.map((group) => {
            if (group.items.length === 0) return null;

            return (
              <div
                key={group.key}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm"
              >
                {filters.groupBy !== 'none' && (
                  <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] m-0">
                      {group.label}
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        <th className="py-3 px-4 sm:px-6">Cor</th>
                        <th className="py-3 px-4">Nome</th>
                        <th className="py-3 px-4">Raridade</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Descrição</th>
                        <th className="py-3 px-4 text-center">Usuários</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                      {group.items.map((title) => {
                        const userCount = counts[title.id] ?? 0;
                        const rarity = title.rarityId ? rarityMap.get(title.rarityId) : null;

                        return (
                          <tr
                            key={title.id}
                            className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                          >
                            {/* Color Swatch */}
                            <td className="py-4 px-4 sm:px-6 w-16">
                              <div
                                className="w-8 h-8 rounded-lg border border-[var(--border-default)] shadow-xs"
                                style={{ backgroundColor: title.color }}
                                title={title.color}
                              />
                            </td>

                            {/* Name with link to detail */}
                            <td className="py-4 px-4 font-medium">
                              <Link
                                to={`/admin/titulos/${title.id}`}
                                className="hover:underline transition-colors font-medium text-sm inline-flex items-center"
                              >
                                <Chip
                                  label={title.name}
                                  color={title.color}
                                  style={title.chipStyle}
                                />
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
                              {title.description}
                            </td>

                            {/* Count of users */}
                            <td className="py-4 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                              {userCount}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 sm:px-6 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <Link
                                  to={`/admin/titulos/${title.id}`}
                                  className="px-2.5 py-1.5 rounded text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                                >
                                  Atribuir
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(title)}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
