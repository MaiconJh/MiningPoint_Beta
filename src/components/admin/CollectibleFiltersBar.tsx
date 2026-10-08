import React, { useState, useEffect, useTransition } from 'react';
import {
  CollectibleListFilters,
  CollectibleGroupBy,
} from '../../lib/collectibleFilters';
import { useRarities } from '../../hooks/useRarities';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { useOrigins } from '../../hooks/useOrigins';
import { useCollections } from '../../hooks/useCollections';
import { Chip } from '../chip/Chip';

interface CollectibleFiltersBarProps {
  filters: CollectibleListFilters;
  onChange: (next: CollectibleListFilters) => void;
  onClear: () => void;
  totalFiltered: number;
  totalItems: number;
}

const ORDER_PRESETS = [
  { label: 'Todos', min: null, max: null },
  { label: '0 – 10', min: 0, max: 10 },
  { label: '11 – 50', min: 11, max: 50 },
  { label: '51 – 100', min: 51, max: 100 },
  { label: '101+', min: 101, max: null },
] as const;

export const CollectibleFiltersBar: React.FC<CollectibleFiltersBarProps> = ({
  filters,
  onChange,
  onClear,
  totalFiltered,
  totalItems,
}) => {
  const [, startTransition] = useTransition();

  // Busca textual interna com debounce de digitação
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Mantém input sincronizado quando filtros mudam externamente (ex.: URL ou limpar)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce para aplicar busca textual
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        startTransition(() => {
          onChange({
            ...filters,
            search: localSearch,
          });
        });
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [localSearch, filters, onChange]);

  const { rarities } = useRarities();
  const { categories } = useCatalogCategories();
  const { origins } = useOrigins();
  const { collections } = useCollections();

  // Identificação do preset de ordem ativo
  const matchingPresetIndex = ORDER_PRESETS.findIndex(
    (p) => p.min === filters.orderMin && p.max === filters.orderMax
  );

  const [isCustomOrder, setIsCustomOrder] = useState<boolean>(() => {
    return filters.orderMin !== null || filters.orderMax !== null
      ? matchingPresetIndex === -1
      : false;
  });

  useEffect(() => {
    if (filters.orderMin === null && filters.orderMax === null) {
      setIsCustomOrder(false);
    } else if (matchingPresetIndex === -1) {
      setIsCustomOrder(true);
    }
  }, [filters.orderMin, filters.orderMax, matchingPresetIndex]);

  const toggleId = (
    field: 'rarityIds' | 'categoryIds' | 'originIds' | 'collectionIds',
    id: string
  ) => {
    const current = filters[field];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({
      ...filters,
      [field]: next,
    });
  };

  const handleOrderPresetSelect = (min: number | null, max: number | null) => {
    setIsCustomOrder(false);
    onChange({
      ...filters,
      orderMin: min,
      orderMax: max,
    });
  };

  const handleOrderNumberChange = (
    field: 'orderMin' | 'orderMax',
    val: string
  ) => {
    if (val === '') {
      onChange({ ...filters, [field]: null });
      return;
    }
    const parsed = parseInt(val, 10);
    onChange({
      ...filters,
      [field]: isNaN(parsed) ? null : Math.max(0, Math.min(999, parsed)),
    });
  };

  const handleUnclassifiedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onChange({
      ...filters,
      unclassified: checked,
      // Se selecionou apenas sem classificação, limpa filtros de entidade que conflitariam
      ...(checked
        ? {
            rarityIds: [],
            categoryIds: [],
            originIds: [],
            collectionIds: [],
          }
        : {}),
    });
  };

  const handleGroupByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      groupBy: e.target.value as CollectibleGroupBy,
    });
  };

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.rarityIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.originIds.length > 0 ||
    filters.collectionIds.length > 0 ||
    filters.orderMin !== null ||
    filters.orderMax !== null ||
    filters.unclassified ||
    filters.groupBy !== 'none';

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-4 shadow-xs">
      {/* Linha superior: Busca textual + Agrupamento + Status/Limpar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Busca textual */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onChange({ ...filters, search: '' });
              }}
              className="absolute right-2.5 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer px-1"
              aria-label="Limpar busca"
            >
              &times;
            </button>
          )}
        </div>

        {/* Agrupamento */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="filter-group-by"
            className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
          >
            Agrupar por
          </label>
          <select
            id="filter-group-by"
            value={filters.groupBy}
            onChange={handleGroupByChange}
            className="px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
          >
            <option value="none">Nenhum</option>
            <option value="category">Categoria</option>
            <option value="collection">Coleção</option>
            <option value="rarity">Raridade</option>
            <option value="origin">Origem</option>
          </select>
        </div>

        {/* Contador e Botão Limpar */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
          <span className="text-[var(--text-muted)] font-mono">
            {totalFiltered === totalItems
              ? `${totalItems} itens`
              : `${totalFiltered} de ${totalItems} itens`}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-error)_30%,transparent)] transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Filtros de Catálogo: Raridade, Categoria, Origem, Coleção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Raridade */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Raridade {filters.rarityIds.length > 0 && `(${filters.rarityIds.length})`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {rarities.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] italic">Nenhuma raridade</span>
            ) : (
              rarities.map((r) => {
                const isSelected = filters.rarityIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={filters.unclassified}
                    onClick={() => toggleId('rarityIds', r.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center justify-center leading-none rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-surface)]'
                        : 'hover:opacity-80'
                    }`}
                  >
                    <Chip label={r.label} color={r.color} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Categoria */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Categoria {filters.categoryIds.length > 0 && `(${filters.categoryIds.length})`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] italic">Nenhuma categoria</span>
            ) : (
              categories.map((c) => {
                const isSelected = filters.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={filters.unclassified}
                    onClick={() => toggleId('categoryIds', c.id)}
                    aria-pressed={isSelected}
                    title={c.name}
                    className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer max-w-[180px] truncate disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Origem */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Origem {filters.originIds.length > 0 && `(${filters.originIds.length})`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {origins.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] italic">Nenhuma origem</span>
            ) : (
              origins.map((o) => {
                const isSelected = filters.originIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={filters.unclassified}
                    onClick={() => toggleId('originIds', o.id)}
                    aria-pressed={isSelected}
                    title={o.name}
                    className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer max-w-[180px] truncate disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {o.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coleção */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Coleção {filters.collectionIds.length > 0 && `(${filters.collectionIds.length})`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {collections.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)] italic">Nenhuma coleção</span>
            ) : (
              collections.map((col) => {
                const isSelected = filters.collectionIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    disabled={filters.unclassified}
                    onClick={() => toggleId('collectionIds', col.id)}
                    aria-pressed={isSelected}
                    title={col.name}
                    className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer max-w-[180px] truncate disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Linha inferior: Faixa de Ordem (Presets + Custom) + Toggle Sem Classificação */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs">
        {/* Faixa de ordem */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Ordem:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ORDER_PRESETS.map((p, idx) => {
              const isSelected = !isCustomOrder && matchingPresetIndex === idx;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleOrderPresetSelect(p.min, p.max)}
                  aria-pressed={isSelected}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                      : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCustomOrder(true)}
              aria-pressed={isCustomOrder}
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                isCustomOrder
                  ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                  : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              Custom…
            </button>
          </div>

          {/* Inputs Customizados revelados ao selecionar Custom */}
          {isCustomOrder && (
            <div className="flex items-center gap-1.5 font-mono ml-1">
              <input
                type="number"
                min={0}
                max={999}
                placeholder="Mín"
                value={filters.orderMin ?? ''}
                onChange={(e) => handleOrderNumberChange('orderMin', e.target.value)}
                className="w-16 font-mono px-2 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <span className="text-[var(--text-muted)]">—</span>
              <input
                type="number"
                min={0}
                max={999}
                placeholder="Máx"
                value={filters.orderMax ?? ''}
                onChange={(e) => handleOrderNumberChange('orderMax', e.target.value)}
                className="w-16 font-mono px-2 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          )}
        </div>

        {/* Toggle Switch Sem Classificação */}
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.unclassified}
              onChange={handleUnclassifiedChange}
              className="sr-only peer"
            />
            <div
              className={`w-9 h-5 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-surface)] ${
                filters.unclassified
                  ? 'bg-[var(--brand-primary)]'
                  : 'bg-[var(--border-strong)] group-hover:bg-[var(--text-muted)]'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-xs transition-transform ${
                filters.unclassified
                  ? 'translate-x-4 bg-[var(--text-on-primary)]'
                  : 'translate-x-0 bg-[var(--text-primary)]'
              }`}
            />
          </div>
          <span
            className={`text-xs transition-colors ${
              filters.unclassified
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            Apenas sem classificação
          </span>
        </label>
      </div>
    </div>
  );
};
