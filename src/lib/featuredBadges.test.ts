import { describe, it, expect } from 'vitest';
import { sortFeaturedBadges, FeaturedBadgesMode } from './featuredBadges';
import { FeaturedBadgeItem, Badge, UserBadge } from '../types/profile';
import { Rarity } from '../types/rarity';
import { Timestamp } from 'firebase/firestore';

const createMockItem = (
  id: string,
  name: string,
  badgeOrder = 0,
  rarityId: string | null = null
): FeaturedBadgeItem => {
  const badge: Badge = {
    id,
    name,
    description: `Desc ${name}`,
    icon: 'award',
    order: badgeOrder,
    rarityId,
    createdAt: Timestamp.now(),
    createdBy: 'admin',
  };
  const userBadge: UserBadge = {
    id: `ub_${id}`,
    userId: 'user1',
    badgeId: id,
    awardedAt: Timestamp.now(),
    awardedBy: 'admin',
  };
  return { badge, userBadge };
};

describe('sortFeaturedBadges', () => {
  const raritiesMap = new Map<string, Rarity>([
    [
      'common',
      {
        id: 'common',
        label: 'Comum',
        color: '#ccc',
        order: 1,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
    ],
    [
      'rare',
      {
        id: 'rare',
        label: 'Raro',
        color: '#00f',
        order: 2,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
    ],
    [
      'legendary',
      {
        id: 'legendary',
        label: 'Lendário',
        color: '#fa0',
        order: 5,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
    ],
  ]);

  it('retorna array vazio quando items estiver vazio', () => {
    expect(sortFeaturedBadges([], 'manual')).toEqual([]);
    expect(sortFeaturedBadges([], 'auto')).toEqual([]);
  });

  it('mantém ordem exata no modo manual', () => {
    const item1 = createMockItem('1', 'Zeta', 10, 'common');
    const item2 = createMockItem('2', 'Alfa', 1, 'legendary');
    const items = [item1, item2];

    const result = sortFeaturedBadges(items, 'manual', raritiesMap);
    expect(result.map((i) => i.badge.id)).toEqual(['1', '2']);
  });

  it('ordena por raridade decrescente no modo automático', () => {
    const commonItem = createMockItem('1', 'Comum A', 0, 'common');
    const rareItem = createMockItem('2', 'Raro B', 0, 'rare');
    const legendaryItem = createMockItem('3', 'Lendário C', 0, 'legendary');

    const items = [commonItem, rareItem, legendaryItem];
    const result = sortFeaturedBadges(items, 'auto', raritiesMap);

    expect(result.map((i) => i.badge.id)).toEqual(['3', '2', '1']);
  });

  it('desempata por order da insígnia ascendente quando a raridade for igual', () => {
    const badgeHighOrder = createMockItem('1', 'Zeta', 10, 'rare');
    const badgeLowOrder = createMockItem('2', 'Beta', 2, 'rare');

    const items = [badgeHighOrder, badgeLowOrder];
    const result = sortFeaturedBadges(items, 'auto', raritiesMap);

    expect(result.map((i) => i.badge.id)).toEqual(['2', '1']);
  });

  it('desempata por nome da insígnia ascendente quando raridade e order forem iguais', () => {
    const badgeZ = createMockItem('1', 'Zênite', 5, 'rare');
    const badgeA = createMockItem('2', 'Aurora', 5, 'rare');

    const items = [badgeZ, badgeA];
    const result = sortFeaturedBadges(items, 'auto', raritiesMap);

    expect(result.map((i) => i.badge.id)).toEqual(['2', '1']);
  });

  it('funciona com Record de raridades além de Map', () => {
    const raritiesRecord: Record<string, Rarity> = {
      common: {
        id: 'common',
        label: 'Comum',
        color: '#ccc',
        order: 1,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
      legendary: {
        id: 'legendary',
        label: 'Lendário',
        color: '#fa0',
        order: 5,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
    };

    const item1 = createMockItem('1', 'Zeta', 0, 'common');
    const item2 = createMockItem('2', 'Alfa', 0, 'legendary');

    const result = sortFeaturedBadges([item1, item2], 'auto', raritiesRecord);
    expect(result.map((i) => i.badge.id)).toEqual(['2', '1']);
  });
});
