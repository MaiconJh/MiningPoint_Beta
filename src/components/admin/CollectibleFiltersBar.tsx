import React, { useState, useEffect, useTransition } from 'react';
import {
  CollectibleListFilters,
  CollectibleGroupBy,
} from '../../lib/collectibleFilters';
import { useRarities } from '../../hooks/useRarities';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { useOrigins } from '../../hooks/useOrigins';
import { useCollections } from '../../hooks/useCollections';

interface CollectibleFiltersBarProps {
  filters: CollectibleListFilters;
  onChange: (next: CollectibleListFilters) => void;
  onClear: () => void;
  totalFiltered: number;
  totalItems: number;
}

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

  const handleMultiSelectChange = (
    field: 'rarityIds' | 'categoryIds' | 'originIds' | 'collectionIds',
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    onChange({
      ...filters,
      [field]: selected,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Raridade */}
        <div className="space-y-1">
          <label
            htmlFor="filter-rarity"
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
          >
            Raridade {filters.rarityIds.length > 0 && `(${filters.rarityIds.length})`}
          </label>
          <select
            id="filter-rarity"
            multiple
            size={3}
            disabled={filters.unclassified}
            value={filters.rarityIds}
            onChange={(e) => handleMultiSelectChange('rarityIds', e)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {rarities.map((r) => (
              <option key={r.id} value={r.id} className="py-0.5">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div className="space-y-1">
          <label
            htmlFor="filter-category"
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
          >
            Categoria {filters.categoryIds.length > 0 && `(${filters.categoryIds.length})`}
          </label>
          <select
            id="filter-category"
            multiple
            size={3}
            disabled={filters.unclassified}
            value={filters.categoryIds}
            onChange={(e) => handleMultiSelectChange('categoryIds', e)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="py-0.5">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Origem */}
        <div className="space-y-1">
          <label
            htmlFor="filter-origin"
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
          >
            Origem {filters.originIds.length > 0 && `(${filters.originIds.length})`}
          </label>
          <select
            id="filter-origin"
            multiple
            size={3}
            disabled={filters.unclassified}
            value={filters.originIds}
            onChange={(e) => handleMultiSelectChange('originIds', e)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {origins.map((o) => (
              <option key={o.id} value={o.id} className="py-0.5">
                {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* Coleção */}
        <div className="space-y-1">
          <label
            htmlFor="filter-collection"
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
          >
            Coleção {filters.collectionIds.length > 0 && `(${filters.collectionIds.length})`}
          </label>
          <select
            id="filter-collection"
            multiple
            size={3}
            disabled={filters.unclassified}
            value={filters.collectionIds}
            onChange={(e) => handleMultiSelectChange('collectionIds', e)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {collections.map((col) => (
              <option key={col.id} value={col.id} className="py-0.5">
                {col.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha inferior: Faixa de Ordem + Checkbox Sem Classificação */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs">
        {/* Faixa de ordem */}
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
            Ordem:
          </span>
          <input
            type="number"
            min={0}
            max={999}
            placeholder="Mín"
            value={filters.orderMin ?? ''}
            onChange={(e) => handleOrderNumberChange('orderMin', e.target.value)}
            className="w-20 font-mono px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
          />
          <span className="text-[var(--text-muted)]">—</span>
          <input
            type="number"
            min={0}
            max={999}
            placeholder="Máx"
            value={filters.orderMax ?? ''}
            onChange={(e) => handleOrderNumberChange('orderMax', e.target.value)}
            className="w-20 font-mono px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--brand-primary)]"
          />
        </div>

        {/* Toggle Sem Classificação */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={filters.unclassified}
            onChange={handleUnclassifiedChange}
            className="rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="font-medium">Apenas sem classificação</span>
        </label>
      </div>
    </div>
  );
};
