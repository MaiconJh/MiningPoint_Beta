export type CollectibleGroupBy =
  | 'none'
  | 'category'
  | 'collection'
  | 'rarity'
  | 'origin';

export interface CollectibleListFilters {
  search: string;
  rarityIds: string[];
  categoryIds: string[];
  originIds: string[];
  collectionIds: string[];
  orderMin: number | null;
  orderMax: number | null;
  unclassified: boolean;
  groupBy: CollectibleGroupBy;
}

export const DEFAULT_FILTERS: CollectibleListFilters = {
  search: '',
  rarityIds: [],
  categoryIds: [],
  originIds: [],
  collectionIds: [],
  orderMin: null,
  orderMax: null,
  unclassified: false,
  groupBy: 'none',
};

export interface CollectibleFilterable {
  name: string;
  rarityId?: string | null;
  categoryId?: string | null;
  originId?: string | null;
  collectionId?: string | null;
  order?: number;
}

export interface CatalogEntitySummary {
  id: string;
  name?: string;
  label?: string;
  order?: number;
}

export interface CatalogLookupContext {
  rarities?: Map<string, CatalogEntitySummary>;
  categories?: Map<string, CatalogEntitySummary>;
  origins?: Map<string, CatalogEntitySummary>;
  collections?: Map<string, CatalogEntitySummary>;
}

export interface CollectibleGroup<T> {
  key: string;
  label: string;
  items: T[];
}

const VALID_GROUP_BY: CollectibleGroupBy[] = [
  'none',
  'category',
  'collection',
  'rarity',
  'origin',
];

const parseCsvParam = (value: string | null): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const parseFiltersFromUrl = (
  searchParams: URLSearchParams
): CollectibleListFilters => {
  const search = searchParams.get('search') ?? '';
  const rarityIds = parseCsvParam(searchParams.get('rarity'));
  const categoryIds = parseCsvParam(searchParams.get('category'));
  const originIds = parseCsvParam(searchParams.get('origin'));
  const collectionIds = parseCsvParam(searchParams.get('collection'));

  const rawMin = searchParams.get('orderMin');
  const parsedMin = rawMin !== null ? parseInt(rawMin, 10) : null;
  const orderMin = parsedMin !== null && !isNaN(parsedMin) ? parsedMin : null;

  const rawMax = searchParams.get('orderMax');
  const parsedMax = rawMax !== null ? parseInt(rawMax, 10) : null;
  const orderMax = parsedMax !== null && !isNaN(parsedMax) ? parsedMax : null;

  const unclassified = searchParams.get('unclassified') === '1';

  const rawGroupBy = searchParams.get('groupBy') as CollectibleGroupBy | null;
  const groupBy: CollectibleGroupBy =
    rawGroupBy && VALID_GROUP_BY.includes(rawGroupBy) ? rawGroupBy : 'none';

  return {
    search,
    rarityIds,
    categoryIds,
    originIds,
    collectionIds,
    orderMin,
    orderMax,
    unclassified,
    groupBy,
  };
};

export const filtersToSearchParams = (
  filters: CollectibleListFilters
): URLSearchParams => {
  const params = new URLSearchParams();

  const trimmedSearch = filters.search.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  if (filters.rarityIds.length > 0) {
    params.set('rarity', filters.rarityIds.join(','));
  }

  if (filters.categoryIds.length > 0) {
    params.set('category', filters.categoryIds.join(','));
  }

  if (filters.originIds.length > 0) {
    params.set('origin', filters.originIds.join(','));
  }

  if (filters.collectionIds.length > 0) {
    params.set('collection', filters.collectionIds.join(','));
  }

  if (filters.orderMin !== null && !isNaN(filters.orderMin)) {
    params.set('orderMin', String(filters.orderMin));
  }

  if (filters.orderMax !== null && !isNaN(filters.orderMax)) {
    params.set('orderMax', String(filters.orderMax));
  }

  if (filters.unclassified) {
    params.set('unclassified', '1');
  }

  if (filters.groupBy !== 'none') {
    params.set('groupBy', filters.groupBy);
  }

  return params;
};

export const applyFilters = <T extends CollectibleFilterable>(
  items: T[],
  filters: CollectibleListFilters
): T[] => {
  const searchLower = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    // 1. Busca textual no nome
    if (searchLower && !item.name.toLowerCase().includes(searchLower)) {
      return false;
    }

    // 2. Filtro de raridade (OR dentro do array)
    if (
      filters.rarityIds.length > 0 &&
      (!item.rarityId || !filters.rarityIds.includes(item.rarityId))
    ) {
      return false;
    }

    // 3. Filtro de categoria (OR dentro do array)
    if (
      filters.categoryIds.length > 0 &&
      (!item.categoryId || !filters.categoryIds.includes(item.categoryId))
    ) {
      return false;
    }

    // 4. Filtro de origem (OR dentro do array)
    if (
      filters.originIds.length > 0 &&
      (!item.originId || !filters.originIds.includes(item.originId))
    ) {
      return false;
    }

    // 5. Filtro de coleção (OR dentro do array)
    if (
      filters.collectionIds.length > 0 &&
      (!item.collectionId || !filters.collectionIds.includes(item.collectionId))
    ) {
      return false;
    }

    // 6. Faixa de ordem (mínimo)
    if (filters.orderMin !== null) {
      const itemOrder = item.order ?? 0;
      if (itemOrder < filters.orderMin) {
        return false;
      }
    }

    // 7. Faixa de ordem (máximo)
    if (filters.orderMax !== null) {
      const itemOrder = item.order ?? 0;
      if (itemOrder > filters.orderMax) {
        return false;
      }
    }

    // 8. Apenas sem classificação (todos os 4 IDs ausentes/nulos)
    if (filters.unclassified) {
      const isClassified = Boolean(
        item.rarityId || item.categoryId || item.originId || item.collectionId
      );
      if (isClassified) {
        return false;
      }
    }

    return true;
  });
};

export const groupCollectibles = <T extends CollectibleFilterable>(
  items: T[],
  groupBy: CollectibleGroupBy,
  lookup: CatalogLookupContext = {}
): CollectibleGroup<T>[] => {
  if (groupBy === 'none') {
    return [
      {
        key: 'all',
        label: '',
        items,
      },
    ];
  }

  const groupBuckets = new Map<string, T[]>();
  const unclassifiedItems: T[] = [];

  for (const item of items) {
    let key: string | null = null;
    if (groupBy === 'category') key = item.categoryId ?? null;
    else if (groupBy === 'collection') key = item.collectionId ?? null;
    else if (groupBy === 'rarity') key = item.rarityId ?? null;
    else if (groupBy === 'origin') key = item.originId ?? null;

    if (!key) {
      unclassifiedItems.push(item);
    } else {
      const bucket = groupBuckets.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        groupBuckets.set(key, [item]);
      }
    }
  }

  const getEntitySummary = (id: string): CatalogEntitySummary | undefined => {
    if (groupBy === 'category') return lookup.categories?.get(id);
    if (groupBy === 'collection') return lookup.collections?.get(id);
    if (groupBy === 'rarity') return lookup.rarities?.get(id);
    if (groupBy === 'origin') return lookup.origins?.get(id);
    return undefined;
  };

  const getLabel = (id: string): string => {
    const summary = getEntitySummary(id);
    return summary?.label || summary?.name || id;
  };

  const sortedKeys = Array.from(groupBuckets.keys()).sort((a, b) => {
    const entityA = getEntitySummary(a);
    const entityB = getEntitySummary(b);
    const orderA = entityA?.order ?? 0;
    const orderB = entityB?.order ?? 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const labelA = getLabel(a);
    const labelB = getLabel(b);
    return labelA.localeCompare(labelB);
  });

  const result: CollectibleGroup<T>[] = sortedKeys.map((key) => ({
    key,
    label: getLabel(key),
    items: groupBuckets.get(key) || [],
  }));

  if (unclassifiedItems.length > 0) {
    result.push({
      key: '__unclassified__',
      label: 'Sem classificação',
      items: unclassifiedItems,
    });
  }

  return result;
};
