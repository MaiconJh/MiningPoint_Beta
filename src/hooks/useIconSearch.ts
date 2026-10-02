import { useDeferredValue, useMemo } from 'react';
import { CategoryKey } from '../data/icons/categories';
import { ICON_REGISTRY, IconEntry } from '../data/icons/iconRegistry';

export interface UseIconSearchOptions {
  query: string;
  category: CategoryKey | 'custom' | 'all';
  customIcons?: IconEntry[];
}

export function useIconSearch(options: UseIconSearchOptions): { results: IconEntry[]; isStale: boolean };
export function useIconSearch(
  rawQuery: string,
  activeCategory: CategoryKey | 'custom' | 'all',
  customIcons?: IconEntry[]
): { results: IconEntry[]; isStale: boolean };
export function useIconSearch(
  arg1: string | UseIconSearchOptions,
  arg2?: CategoryKey | 'custom' | 'all',
  arg3: IconEntry[] = []
): { results: IconEntry[]; isStale: boolean } {
  const isOptionsObj = typeof arg1 === 'object' && arg1 !== null;
  const rawQuery = isOptionsObj ? arg1.query : arg1;
  const activeCategory = isOptionsObj ? arg1.category : (arg2 || 'all');
  const customIcons = isOptionsObj ? (arg1.customIcons || []) : (arg3 || []);

  const deferredQuery = useDeferredValue(rawQuery);
  const isStale = deferredQuery !== rawQuery;

  const results = useMemo(() => {
    const queryLower = deferredQuery.trim().toLowerCase();

    // Source pool depends on category
    let pool: IconEntry[] = [];
    if (activeCategory === 'custom') {
      pool = customIcons;
    } else if (activeCategory === 'all') {
      pool = [...ICON_REGISTRY, ...customIcons];
    } else {
      const lucideFiltered = ICON_REGISTRY.filter((e) => e.category === activeCategory);
      const customFiltered = customIcons.filter((e) => e.category === activeCategory);
      pool = [...lucideFiltered, ...customFiltered];
    }

    if (!queryLower) {
      return pool;
    }

    return pool.filter((entry) => {
      if (entry.slug.toLowerCase().includes(queryLower)) {
        return true;
      }
      if (entry.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      return entry.tags.some((tag) => tag.toLowerCase().includes(queryLower));
    });
  }, [deferredQuery, activeCategory, customIcons]);

  return { results, isStale };
}
