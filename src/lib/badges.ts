import {
  collection,
  getDocs,
  query,
  where,
  limit,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Badge, UserBadge } from '../types/profile';
import { createCollectibleRepository } from './collectibles';
import {
  countUsersWithCollectible,
  listUsersWithCollectible,
  grantCollectible,
  revokeCollectible,
} from './collectibleLinks';

export interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  rarityId?: string | null;
  categoryId?: string | null;
  originId?: string | null;
  collectionId?: string | null;
  order?: number;
  linkedTitleIds?: string[];
}

export interface UserWithBadgeItem {
  userBadge: UserBadge;
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
  };
}

export interface SearchUserResult {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

const parseBadgeDoc = (id: string, data: DocumentData): Badge => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    icon: data.icon || 'award',
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
    rarityId: data.rarityId || null,
    categoryId: data.categoryId || null,
    originId: data.originId || null,
    collectionId: data.collectionId || null,
    order: typeof data.order === 'number' ? Math.max(0, Math.min(999, data.order)) : 0,
    linkedTitleIds: Array.isArray(data.linkedTitleIds) ? data.linkedTitleIds : [],
  };
};

const badgeRepository = createCollectibleRepository<Badge, BadgeFormData>({
  collectionName: 'badges',
  fallbackSlug: 'insignia',
  logItemName: 'badge',
  userCountErrorMessage: 'Não é possível excluir: há usuários com esta insígnia.',
  deleteErrorMessage: 'Erro ao excluir a insígnia.',
  parse: parseBadgeDoc,
  formatCreatePayload: (data) => ({
    name: data.name.trim(),
    description: data.description.trim(),
    icon: data.icon,
    rarityId: data.rarityId || null,
    categoryId: data.categoryId || null,
    originId: data.originId || null,
    collectionId: data.collectionId || null,
    order: typeof data.order === 'number' && !isNaN(data.order) ? Math.max(0, Math.min(999, data.order)) : 0,
    linkedTitleIds: data.linkedTitleIds ?? [],
  }),
  formatUpdatePayload: (data) => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.icon !== undefined) payload.icon = data.icon;
    if (data.rarityId !== undefined) payload.rarityId = data.rarityId || null;
    if (data.categoryId !== undefined) payload.categoryId = data.categoryId || null;
    if (data.originId !== undefined) payload.originId = data.originId || null;
    if (data.collectionId !== undefined) payload.collectionId = data.collectionId || null;
    if (data.order !== undefined) {
      payload.order = typeof data.order === 'number' && !isNaN(data.order) ? Math.max(0, Math.min(999, data.order)) : 0;
    }
    if (data.linkedTitleIds !== undefined) {
      payload.linkedTitleIds = data.linkedTitleIds;
    }
    return payload;
  },
  clientSort: (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
  countUsersWith: (badgeId) => countUsersWithCollectible('badge', badgeId),
});

export const listBadges = async (): Promise<Badge[]> => badgeRepository.list();

export const getBadge = async (badgeId: string): Promise<Badge | null> =>
  badgeRepository.get(badgeId);

export const createBadge = async (
  data: BadgeFormData,
  createdBy: string
): Promise<{ id: string }> => badgeRepository.create(data, createdBy);

export const updateBadge = async (
  badgeId: string,
  data: Partial<BadgeFormData>
): Promise<void> => badgeRepository.update(badgeId, data);

export const countUsersWithBadge = async (badgeId: string): Promise<number> =>
  badgeRepository.countUsersWith(badgeId);

export const deleteBadge = async (
  badgeId: string
): Promise<{ success: boolean; error?: string }> => badgeRepository.remove(badgeId);

export const listUsersWithBadge = async (badgeId: string): Promise<UserWithBadgeItem[]> => {
  const items = await listUsersWithCollectible('badge', badgeId);
  return items.map((item) => ({
    userBadge: {
      id: item.userCollectible.id,
      userId: item.userCollectible.userId,
      badgeId: item.userCollectible.itemId,
      awardedAt: item.userCollectible.awardedAt,
      awardedBy: item.userCollectible.awardedBy,
    },
    user: item.user,
  }));
};

export const grantBadge = async (
  userId: string,
  badgeId: string,
  awardedBy: string
): Promise<string> => {
  const result = await grantCollectible(userId, 'badge', badgeId, awardedBy);
  try {
    const badge = await getBadge(badgeId);
    if (badge && Array.isArray(badge.linkedTitleIds) && badge.linkedTitleIds.length > 0) {
      await Promise.all(
        badge.linkedTitleIds.map((targetTitleId) =>
          grantCollectible(userId, 'title', targetTitleId, awardedBy)
        )
      );
    }
  } catch (err) {
    console.error('Erro ao propagar ganchos da insígnia:', err);
  }
  return result;
};

export const revokeBadge = async (userBadgeId: string): Promise<void> => {
  return revokeCollectible(userBadgeId);
};

export const searchUsers = async (searchQuery: string): Promise<SearchUserResult[]> => {
  if (!db) return [];
  const qStr = searchQuery.trim();
  if (!qStr) return [];

  try {
    const usersRef = collection(db, 'users');
    const resultsMap = new Map<string, SearchUserResult>();

    // Prefix search on displayName
    const qName = query(
      usersRef,
      where('displayName', '>=', qStr),
      where('displayName', '<=', qStr + '\uf8ff'),
      limit(10)
    );

    // Prefix search on email
    const qEmail = query(
      usersRef,
      where('email', '>=', qStr),
      where('email', '<=', qStr + '\uf8ff'),
      limit(10)
    );

    const [snapName, snapEmail] = await Promise.all([
      getDocs(qName).catch(() => null),
      getDocs(qEmail).catch(() => null),
    ]);

    snapName?.forEach((d) => {
      const data = d.data();
      resultsMap.set(d.id, {
        uid: d.id,
        displayName: data.displayName || 'Sem nome',
        email: data.email || '',
        photoURL: data.photoURL || null,
      });
    });

    snapEmail?.forEach((d) => {
      const data = d.data();
      resultsMap.set(d.id, {
        uid: d.id,
        displayName: data.displayName || 'Sem nome',
        email: data.email || '',
        photoURL: data.photoURL || null,
      });
    });

    // Also try capitalized prefix if starts with lowercase
    if (qStr.length > 0 && qStr[0] !== qStr[0].toUpperCase()) {
      const capitalized = qStr[0].toUpperCase() + qStr.slice(1);
      const qCap = query(
        usersRef,
        where('displayName', '>=', capitalized),
        where('displayName', '<=', capitalized + '\uf8ff'),
        limit(10)
      );
      const snapCap = await getDocs(qCap).catch(() => null);
      snapCap?.forEach((d) => {
        const data = d.data();
        resultsMap.set(d.id, {
          uid: d.id,
          displayName: data.displayName || 'Sem nome',
          email: data.email || '',
          photoURL: data.photoURL || null,
        });
      });
    }

    return Array.from(resultsMap.values());
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};
