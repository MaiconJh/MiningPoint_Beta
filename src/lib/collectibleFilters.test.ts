import { describe, it, expect } from 'vitest';
import {
  parseFiltersFromUrl,
  filtersToSearchParams,
  applyFilters,
  groupCollectibles,
  DEFAULT_FILTERS,
  CollectibleListFilters,
  CollectibleFilterable,
} from './collectibleFilters';

describe('collectibleFilters', () => {
  describe('parseFiltersFromUrl e filtersToSearchParams', () => {
    it('faz parse correto dos parâmetros padrões / vazios', () => {
      const sp = new URLSearchParams();
      const parsed = parseFiltersFromUrl(sp);
      expect(parsed).toEqual(DEFAULT_FILTERS);
    });

    it('faz parse de todos os parâmetros presentes na URL', () => {
      const sp = new URLSearchParams(
        'search=ouro&rarity=r1,r2&category=c1&origin=o1&collection=col1,col2&orderMin=10&orderMax=50&unclassified=1&groupBy=category'
      );
      const parsed = parseFiltersFromUrl(sp);

      expect(parsed.search).toBe('ouro');
      expect(parsed.rarityIds).toEqual(['r1', 'r2']);
      expect(parsed.categoryIds).toEqual(['c1']);
      expect(parsed.originIds).toEqual(['o1']);
      expect(parsed.collectionIds).toEqual(['col1', 'col2']);
      expect(parsed.orderMin).toBe(10);
      expect(parsed.orderMax).toBe(50);
      expect(parsed.unclassified).toBe(true);
      expect(parsed.groupBy).toBe('category');
    });

    it('ignora NaN em orderMin/orderMax e faz fallback para groupBy inválido', () => {
      const sp = new URLSearchParams(
        'orderMin=invalido&orderMax=&groupBy=nao_existe'
      );
      const parsed = parseFiltersFromUrl(sp);
      expect(parsed.orderMin).toBeNull();
      expect(parsed.orderMax).toBeNull();
      expect(parsed.groupBy).toBe('none');
    });

    it('serializa apenas parâmetros preenchidos e não-default', () => {
      const filters: CollectibleListFilters = {
        ...DEFAULT_FILTERS,
        search: '  prata  ',
        rarityIds: ['r1', 'r2'],
        unclassified: true,
        groupBy: 'rarity',
      };
      const sp = filtersToSearchParams(filters);

      expect(sp.get('search')).toBe('prata');
      expect(sp.get('rarity')).toBe('r1,r2');
      expect(sp.get('unclassified')).toBe('1');
      expect(sp.get('groupBy')).toBe('rarity');
      expect(sp.has('category')).toBe(false);
      expect(sp.has('orderMin')).toBe(false);
    });
  });

  describe('applyFilters', () => {
    interface TestItem extends CollectibleFilterable {
      id: string;
    }

    const mockItems: TestItem[] = [
      {
        id: '1',
        name: 'Insígnia Fundador',
        rarityId: 'legendary',
        categoryId: 'comunidade',
        originId: 'evento',
        collectionId: 'alpha',
        order: 10,
      },
      {
        id: '2',
        name: 'Insígnia Apoiador',
        rarityId: 'rare',
        categoryId: 'doacao',
        originId: 'loja',
        collectionId: 'alpha',
        order: 25,
      },
      {
        id: '3',
        name: 'Membro Comum',
        rarityId: 'common',
        categoryId: 'comunidade',
        originId: null,
        collectionId: null,
        order: 50,
      },
      {
        id: '4',
        name: 'Sem Tags',
        rarityId: null,
        categoryId: null,
        originId: null,
        collectionId: null,
        order: 0,
      },
    ];

    it('retorna todos os itens se filtros estiverem no default', () => {
      const filtered = applyFilters(mockItems, DEFAULT_FILTERS);
      expect(filtered.length).toBe(4);
    });

    it('filtra por busca textual insensível a maiúsculas/minúsculas', () => {
      const filtered = applyFilters(mockItems, {
        ...DEFAULT_FILTERS,
        search: 'insígnia',
      });
      expect(filtered.map((i) => i.id)).toEqual(['1', '2']);
    });

    it('aplica OR dentro da mesma entidade (raridade)', () => {
      const filtered = applyFilters(mockItems, {
        ...DEFAULT_FILTERS,
        rarityIds: ['legendary', 'common'],
      });
      expect(filtered.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('aplica AND entre entidades diferentes', () => {
      const filtered = applyFilters(mockItems, {
        ...DEFAULT_FILTERS,
        categoryIds: ['comunidade'],
        rarityIds: ['legendary'],
      });
      expect(filtered.map((i) => i.id)).toEqual(['1']);
    });

    it('filtra por faixa de ordem (orderMin e orderMax)', () => {
      const filtered = applyFilters(mockItems, {
        ...DEFAULT_FILTERS,
        orderMin: 15,
        orderMax: 40,
      });
      expect(filtered.map((i) => i.id)).toEqual(['2']);
    });

    it('filtra por apenas não-classificados', () => {
      const filtered = applyFilters(mockItems, {
        ...DEFAULT_FILTERS,
        unclassified: true,
      });
      expect(filtered.map((i) => i.id)).toEqual(['4']);
    });
  });

  describe('groupCollectibles', () => {
    const mockItems: CollectibleFilterable[] = [
      { id: '1', name: 'Item 1', categoryId: 'cat-b', order: 1 } as any,
      { id: '2', name: 'Item 2', categoryId: 'cat-a', order: 2 } as any,
      { id: '3', name: 'Item 3', categoryId: null, order: 3 } as any,
    ];

    it('retorna um único grupo quando groupBy for none', () => {
      const groups = groupCollectibles(mockItems, 'none');
      expect(groups.length).toBe(1);
      expect(groups[0].key).toBe('all');
      expect(groups[0].items.length).toBe(3);
    });

    it('agrupa por categoria e inclui seção Sem classificação no final', () => {
      const categoriesLookup = new Map([
        ['cat-a', { id: 'cat-a', name: 'Alpha', order: 10 }],
        ['cat-b', { id: 'cat-b', name: 'Beta', order: 5 }],
      ]);

      const groups = groupCollectibles(mockItems, 'category', {
        categories: categoriesLookup,
      });

      expect(groups.length).toBe(3);
      // cat-b tem order 5, então vem primeiro que cat-a (order 10)
      expect(groups[0].key).toBe('cat-b');
      expect(groups[0].label).toBe('Beta');
      expect(groups[1].key).toBe('cat-a');
      expect(groups[1].label).toBe('Alpha');
      expect(groups[2].key).toBe('__unclassified__');
      expect(groups[2].label).toBe('Sem classificação');
    });
  });
});
