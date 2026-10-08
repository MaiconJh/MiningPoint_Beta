import { FeaturedBadgeItem } from '../types/profile';
import { Rarity } from '../types/rarity';

export type FeaturedBadgesMode = 'manual' | 'auto';

const getRarityOrder = (
  rarityId: string | null | undefined,
  raritiesById?: Map<string, Rarity> | Record<string, Rarity>
): number => {
  if (!rarityId || !raritiesById) return -1;
  const rarity =
    raritiesById instanceof Map
      ? raritiesById.get(rarityId)
      : raritiesById[rarityId];
  return typeof rarity?.order === 'number' ? rarity.order : -1;
};

/**
 * Ordena as insígnias destacadas conforme o modo selecionado.
 * No modo manual, preserva a ordem de seleção.
 * No modo automático, ordena por raridade (desc) -> order da insígnia (asc) -> nome (asc).
 */
export const sortFeaturedBadges = (
  items: FeaturedBadgeItem[],
  mode: FeaturedBadgesMode,
  raritiesById?: Map<string, Rarity> | Record<string, Rarity>
): FeaturedBadgeItem[] => {
  if (!items || items.length === 0) return [];
  if (mode === 'manual') {
    return [...items];
  }

  return [...items].sort((a, b) => {
    // 1. Raridade (ordem decrescente: maior order da raridade primeiro)
    const rarityOrderA = getRarityOrder(a.badge?.rarityId, raritiesById);
    const rarityOrderB = getRarityOrder(b.badge?.rarityId, raritiesById);
    if (rarityOrderA !== rarityOrderB) {
      return rarityOrderB - rarityOrderA;
    }

    // 2. Ordem da insígnia (ordem crescente: menor order primeiro)
    const badgeOrderA = typeof a.badge?.order === 'number' ? a.badge.order : 0;
    const badgeOrderB = typeof b.badge?.order === 'number' ? b.badge.order : 0;
    if (badgeOrderA !== badgeOrderB) {
      return badgeOrderA - badgeOrderB;
    }

    // 3. Nome da insígnia (ordem alfabética crescente)
    const nameA = a.badge?.name || '';
    const nameB = b.badge?.name || '';
    return nameA.localeCompare(nameB);
  });
};
