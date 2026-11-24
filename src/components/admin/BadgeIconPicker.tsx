import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Pin from 'lucide-react/dist/esm/icons/pin';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { CATEGORIES, CategoryKey } from '../../data/icons/categories';
import { useIconSearch } from '../../hooks/useIconSearch';
import {
  ICON_REGISTRY,
  IconEntry,
  createCustomIconComponent,
  LucideIcon,
} from '../../data/icons/iconRegistry';
import { listCustomIcons, createCustomIcon } from '../../lib/icons';
import { sanitizeSvg } from '../../lib/svgSanitizer';
import { CustomIcon } from '../../types/icon';
import { useAuth } from '../../context/AuthContext';
import { SvgSourceInput } from './SvgSourceInput';
import { SvgPreview } from './SvgPreview';

export interface BadgeIconPickerProps {
  value: string | null;
  onChange: (slug: string) => void;
  onClear?: () => void;
  defaultValue?: string | null;
  externalCustomIcons?: CustomIcon[];
  onCustomIconCreated?: () => Promise<void> | void;
  createdBy?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  disabled?: boolean;
}

type PickerModeTab = 'existing' | 'create';

const PAGE_SIZE = 48;

const formatCatalogIndex = (index: number): string => {
  return `#${String(index).padStart(3, '0')}`;
};

const matchesIconValue = (entrySlug: string, currentValue: string | null): boolean => {
  if (!currentValue) return false;
  const trimmed = currentValue.trim();
  if (entrySlug === trimmed) return true;
  if (entrySlug.startsWith('lucide:') && trimmed === entrySlug.slice(7)) return true;
  if (trimmed.startsWith('lucide:') && trimmed.slice(7) === entrySlug) return true;
  if (entrySlug.startsWith('custom:') && trimmed === entrySlug.slice(7)) return true;
  if (trimmed.startsWith('custom:') && `custom:${trimmed.slice(7)}` === entrySlug) return true;
  return false;
};

export const BadgeIconPicker: React.FC<BadgeIconPickerProps> = ({
  value,
  onChange,
  onClear,
  defaultValue = 'award',
  externalCustomIcons,
  onCustomIconCreated,
  createdBy,
  defaultTitle = 'Padrão do sistema',
  defaultSubtitle = 'Ícone Lucide padrão',
  disabled = false,
}) => {
  const { user } = useAuth();
  const [modeTab, setModeTab] = useState<PickerModeTab>('existing');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'custom' | 'all'>('all');
  const [fetchedCustomIcons, setFetchedCustomIcons] = useState<CustomIcon[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPinnedInGrid, setIsPinnedInGrid] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Create new SVG state
  const [newName, setNewName] = useState('');
  const [svgSource, setSvgSource] = useState('');
  const [viewBox, setViewBox] = useState('0 0 24 24');
  const [isSvgValid, setIsSvgValid] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadInternalCustomIcons = useCallback(async () => {
    try {
      const data = await listCustomIcons();
      setFetchedCustomIcons(data);
    } catch (err) {
      console.error('Error loading custom icons for picker:', err);
    }
  }, []);

  // Load custom icons lazily on mount when not supplied externally
  useEffect(() => {
    if (externalCustomIcons) return;
    loadInternalCustomIcons();
  }, [externalCustomIcons, loadInternalCustomIcons]);

  const customIcons = externalCustomIcons ?? fetchedCustomIcons;

  // Map custom icons to IconEntry format
  const customIconEntries: IconEntry[] = useMemo(() => {
    return customIcons.map((ci) => ({
      slug: `custom:${ci.id}`,
      component: createCustomIconComponent(ci.svg, ci.viewBox) as unknown as LucideIcon,
      name: ci.name,
      category: ci.category,
      tags: ci.tags,
    }));
  }, [customIcons]);

  const totalCatalogCount = ICON_REGISTRY.length + customIconEntries.length;

  // Deterministic global index map (#001 .. #NNN) across unified catalog
  const catalogIndexBySlug = useMemo(() => {
    const map = new Map<string, number>();
    const allEntries = [...ICON_REGISTRY, ...customIconEntries];
    allEntries.forEach((entry, idx) => {
      map.set(entry.slug, idx + 1);
    });
    return map;
  }, [customIconEntries]);

  // Currently defined/selected icon entry from unified catalog
  const selectedEntry = useMemo(() => {
    if (!value) return null;
    const allEntries = [...ICON_REGISTRY, ...customIconEntries];
    return allEntries.find((entry) => matchesIconValue(entry.slug, value)) || null;
  }, [value, customIconEntries]);

  const selectedIndex = selectedEntry
    ? catalogIndexBySlug.get(selectedEntry.slug) ?? 1
    : null;

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedEntry) return null;
    const isCustom = selectedEntry.slug.startsWith('custom:');
    const catLabel =
      CATEGORIES.find((c) => c.key === selectedEntry.category)?.labelPt ||
      selectedEntry.category;
    return isCustom ? `Custom · ${catLabel}` : catLabel;
  }, [selectedEntry]);

  const { results, isStale } = useIconSearch({
    query,
    category: activeCategory,
    customIcons: customIconEntries,
  });

  // Support searching by catalog index (e.g. "#001" or "#301") and pin selected icon as first square cell when active
  const indexedResults = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    let baseList: IconEntry[];

    if (trimmedQuery.startsWith('#')) {
      const allEntries = [...ICON_REGISTRY, ...customIconEntries];
      baseList = allEntries.filter((entry) => {
        const idx = catalogIndexBySlug.get(entry.slug) ?? 0;
        const formatted = formatCatalogIndex(idx).toLowerCase();
        return formatted.includes(trimmedQuery) || `#${idx}` === trimmedQuery;
      });
    } else {
      baseList = results;
    }

    if (selectedEntry && isPinnedInGrid) {
      const rest = baseList.filter((e) => e.slug !== selectedEntry.slug);
      return [selectedEntry, ...rest];
    }

    return baseList;
  }, [query, results, customIconEntries, catalogIndexBySlug, selectedEntry, isPinnedInGrid]);

  // Reset pagination when category or query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, query]);

  // Infinite scroll observer on sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [indexedResults.length]);

  const handleSvgChange = useCallback(
    (sanitizedSvg: string, sanitizedViewBox?: string, isValid = false) => {
      setSvgSource(sanitizedSvg);
      if (sanitizedViewBox) setViewBox(sanitizedViewBox);
      setIsSvgValid(isValid);
    },
    []
  );

  const handleCreateAndSelect = async () => {
    setCreateError(null);

    if (!newName.trim()) {
      setCreateError('Informe um nome para o novo ícone.');
      return;
    }

    const sanitized = sanitizeSvg(svgSource);
    if (!sanitized.ok) {
      setCreateError(sanitized.error);
      return;
    }

    setCreating(true);
    try {
      const authorUid = createdBy || user?.uid || 'admin';
      const { id } = await createCustomIcon(
        {
          name: newName.trim().slice(0, 40),
          category: 'community',
          tags: ['custom', 'icone', 'sistema'],
          svg: sanitized.svg,
          viewBox: sanitized.viewBox,
        },
        authorUid
      );

      if (onCustomIconCreated) {
        await onCustomIconCreated();
      } else {
        await loadInternalCustomIcons();
      }

      onChange(`custom:${id}`);
      setNewName('');
      setSvgSource('');
      setViewBox('0 0 24 24');
      setIsSvgValid(false);
      setModeTab('existing');
    } catch (err) {
      console.error('Error creating custom icon:', err);
      setCreateError(
        'Não foi possível criar o ícone SVG. Verifique suas permissões e tente novamente.'
      );
    } finally {
      setCreating(false);
    }
  };

  const canRestoreDefault = onClear
    ? value !== null
    : Boolean(defaultValue && value !== defaultValue);

  const handleRestoreDefault = () => {
    if (onClear) {
      onClear();
    } else if (defaultValue) {
      onChange(defaultValue);
    }
  };

  const displayedResults = indexedResults.slice(0, visibleCount);
  const SelectedIconComponent = selectedEntry?.component || null;

  return (
    <div className="space-y-4">
      {/* 1. Standardized Mode Tabs: Escolher existente vs Criar novo SVG */}
      <div className="flex items-center gap-4 border-b border-[var(--border-subtle)]">
        <button
          type="button"
          disabled={disabled || creating}
          onClick={() => setModeTab('existing')}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            modeTab === 'existing'
              ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
          }`}
        >
          Escolher existente ({totalCatalogCount})
        </button>
        <button
          type="button"
          disabled={disabled || creating}
          onClick={() => setModeTab('create')}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            modeTab === 'create'
              ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
          }`}
        >
          Criar novo SVG
        </button>
      </div>

      {/* 2. Pinned & Indexed Selected Icon Card (identical across both interfaces) */}
      {selectedEntry ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--bg-surface))] transition-colors"
          role="region"
          aria-label="Ícone selecionado e fixado"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-[var(--bg-default)] border border-[var(--brand-primary)] flex items-center justify-center shrink-0 text-[var(--brand-primary)]">
              {SelectedIconComponent ? (
                <SelectedIconComponent className="w-[22px] h-[22px]" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedIndex !== null && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--brand-primary)] text-[var(--text-on-primary)]">
                    {formatCatalogIndex(selectedIndex)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--brand-primary)]">
                  <Pin className="w-3 h-3" />
                  <span>{isPinnedInGrid ? 'Fixado na grade' : 'Definido'}</span>
                </span>
                {selectedCategoryLabel && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {selectedCategoryLabel}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] truncate mt-1">
                {selectedEntry.name}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                {selectedEntry.slug}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || creating}
              onClick={() => setIsPinnedInGrid((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                isPinnedInGrid
                  ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title={
                isPinnedInGrid
                  ? 'Desafixar ícone da primeira posição da grade'
                  : 'Fixar ícone na primeira posição da grade'
              }
              aria-label={isPinnedInGrid ? 'Fixado no topo' : 'Fixar no topo'}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{isPinnedInGrid ? 'Fixado no topo' : 'Fixar no topo'}</span>
            </button>

            {canRestoreDefault && (
              <button
                type="button"
                disabled={disabled || creating}
                onClick={handleRestoreDefault}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer disabled:opacity-50"
                title="Restaurar ícone padrão"
                aria-label="Restaurar padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar padrão</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] flex items-center justify-center shrink-0 text-[var(--brand-primary)]">
              <MessageSquare className="w-[22px] h-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {defaultTitle}
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)] truncate">
                {defaultSubtitle}
              </div>
            </div>
          </div>
          <span className="px-2 py-1 rounded text-[11px] font-medium bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            Selecione um ícone abaixo para fixar
          </span>
        </div>
      )}

      {modeTab === 'existing' ? (
        <>
          {/* 3. Search input */}
          <div>
            <input
              type="text"
              disabled={disabled}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ícone por nome, índice (#001) ou tags..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] text-sm disabled:opacity-50"
            />
          </div>

          {/* 4. Category tabs */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 border-b border-[var(--border-subtle)] pb-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory('all')}
              className={`pb-1.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
              }`}
            >
              Todos
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                disabled={disabled}
                onClick={() => setActiveCategory(cat.key)}
                className={`pb-1.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeCategory === cat.key
                    ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
                }`}
              >
                {cat.labelPt}
              </button>
            ))}

            <button
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory('custom')}
              className={`pb-1.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeCategory === 'custom'
                  ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
              }`}
            >
              Custom ({customIconEntries.length})
            </button>
          </div>

          {/* 5. Uniform 8-column Icon Grid (selected icon pinned at cell #1 when isPinnedInGrid is true) */}
          {indexedResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              Nenhum ícone encontrado
            </div>
          ) : (
            <div
              className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 transition-opacity duration-150 max-h-72 overflow-y-auto p-1 ${
                isStale ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {displayedResults.map((entry, idx) => {
                const IconComponent = entry.component;
                const isSelected = matchesIconValue(entry.slug, value);
                const itemIndex = catalogIndexBySlug.get(entry.slug);
                const indexLabel = itemIndex ? formatCatalogIndex(itemIndex) : '';
                const isPinnedCell = isSelected && isPinnedInGrid && idx === 0;

                return (
                  <button
                    key={entry.slug}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(entry.slug)}
                    title={
                      isPinnedCell
                        ? `${indexLabel} · ${entry.name} (Fixado no topo)`
                        : indexLabel
                        ? `${indexLabel} · ${entry.name}`
                        : entry.name
                    }
                    aria-label={indexLabel ? `${indexLabel} ${entry.name}` : entry.name}
                    className={`relative h-[44px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)]'
                        : 'border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {IconComponent ? <IconComponent className="w-5 h-5 shrink-0" /> : null}
                    {isSelected && (
                      <span className="absolute top-0.5 right-1 text-[8px] font-mono font-bold text-[var(--brand-primary)] leading-none">
                        {indexLabel}
                      </span>
                    )}
                    {isPinnedCell && (
                      <Pin className="w-2.5 h-2.5 text-[var(--brand-primary)] absolute bottom-0.5 left-1" />
                    )}
                  </button>
                );
              })}

              {displayedResults.length < indexedResults.length && (
                <div ref={sentinelRef} className="col-span-full h-4 w-full" />
              )}
            </div>
          )}

          {/* 6. Result count */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{indexedResults.length} ícones indexados</span>
            {selectedEntry && selectedIndex !== null && (
              <span className="font-mono text-[var(--text-secondary)]">
                Selecionado: {formatCatalogIndex(selectedIndex)} ({selectedEntry.name})
              </span>
            )}
          </div>
        </>
      ) : (
        /* Create new SVG tab */
        <div className="space-y-4 p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
          {createError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-xs font-medium"
            >
              {createError}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="unified-custom-icon-name"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Nome do novo ícone <span className="text-[var(--feedback-error)]">*</span>
            </label>
            <input
              id="unified-custom-icon-name"
              type="text"
              maxLength={40}
              disabled={disabled || creating}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Picareta de Cristal, Balança de Suporte"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            />
            <span className="text-[11px] text-[var(--text-muted)] block">
              {newName.length}/40 caracteres
            </span>
          </div>

          <SvgSourceInput
            value={svgSource}
            disabled={disabled || creating}
            onChange={handleSvgChange}
          />

          {svgSource.trim() && isSvgValid && (
            <SvgPreview
              svg={svgSource}
              viewBox={viewBox}
              name={newName.trim() || 'Visualização do ícone'}
            />
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              disabled={disabled || creating || !newName.trim() || !isSvgValid}
              onClick={handleCreateAndSelect}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {creating ? 'Criando ícone...' : 'Criar e selecionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


