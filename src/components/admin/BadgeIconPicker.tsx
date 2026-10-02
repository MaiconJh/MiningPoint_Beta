import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CATEGORIES, CategoryKey } from '../../data/icons/categories';
import { useIconSearch } from '../../hooks/useIconSearch';
import { IconEntry, createCustomIconComponent } from '../../data/icons/iconRegistry';
import { listCustomIcons } from '../../lib/icons';
import { CustomIcon } from '../../types/icon';

interface BadgeIconPickerProps {
  value: string | null;
  onChange: (slug: string) => void;
}

const PAGE_SIZE = 48;

export const BadgeIconPicker: React.FC<BadgeIconPickerProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'custom' | 'all'>('all');
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load custom icons lazily on mount
  useEffect(() => {
    let isMounted = true;
    listCustomIcons()
      .then((data) => {
        if (isMounted) setCustomIcons(data);
      })
      .catch((err) => {
        console.error('Error loading custom icons for picker:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map custom icons to IconEntry format
  const customIconEntries: IconEntry[] = useMemo(() => {
    return customIcons.map((ci) => ({
      slug: `custom:${ci.id}`,
      component: createCustomIconComponent(ci.svg, ci.viewBox) as any,
      name: ci.name,
      category: ci.category,
      tags: ci.tags,
    }));
  }, [customIcons]);

  const { results, isStale } = useIconSearch({
    query,
    category: activeCategory,
    customIcons: customIconEntries,
  });

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
  }, [results.length]);

  const displayedResults = results.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      {/* 1. Search input */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ícone por nome ou tags..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
        />
      </div>

      {/* 2. Category tabs */}
      <div className="flex items-center gap-4 overflow-x-auto border-b border-[var(--border-subtle)] pb-px">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`pb-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
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
            onClick={() => setActiveCategory(cat.key)}
            className={`pb-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeCategory === cat.key
                ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
            }`}
          >
            {cat.labelPt}
          </button>
        ))}

        {/* 9th Tab: Custom */}
        <button
          type="button"
          onClick={() => setActiveCategory('custom')}
          className={`pb-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeCategory === 'custom'
              ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
          }`}
        >
          Custom
        </button>
      </div>

      {/* 3. Icon grid */}
      {results.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
          Nenhum ícone encontrado
        </div>
      ) : (
        <div
          className={`grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 transition-opacity duration-150 max-h-72 overflow-y-auto p-1 ${
            isStale ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {displayedResults.map((entry) => {
            const IconComponent = entry.component;
            const isSelected =
              value === entry.slug ||
              (entry.slug.startsWith('lucide:') && value === entry.slug.slice(7)) ||
              (value?.startsWith('lucide:') && value.slice(7) === entry.slug);

            return (
              <button
                key={entry.slug}
                type="button"
                onClick={() => onChange(entry.slug)}
                title={entry.name}
                aria-label={entry.name}
                className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]'
                    : 'border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {IconComponent ? <IconComponent className="w-5 h-5 shrink-0" /> : null}
              </button>
            );
          })}

          {/* Sentinel for infinite scrolling */}
          {displayedResults.length < results.length && (
            <div ref={sentinelRef} className="col-span-full h-4 w-full" />
          )}
        </div>
      )}

      {/* 4. Result count */}
      <div className="text-xs text-[var(--text-muted)]">
        {results.length} ícones
      </div>
    </div>
  );
};
