import {
  doc,
  getDoc,
  deleteField,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Title, UserTitle } from '../types/title';
import { ChipStyle } from '../types/chip';
import { createCollectibleRepository } from './collectibles';
import {
  countUsersWithCollectible,
  listUsersWithCollectible,
  grantCollectible,
  revokeCollectible,
  listUserCollectibles,
} from './collectibleLinks';

export interface TitleFormData {
  name: string;
  description: string;
  color: string;
  chipStyle?: ChipStyle;
  rarityId?: string | null;
  categoryId?: string | null;
  originId?: string | null;
  collectionId?: string | null;
  order?: number;
  linkedBadgeIds?: string[];
}

export interface UserWithTitleItem {
  userTitle: UserTitle;
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
  };
}

const parseTitleDoc = (id: string, data: DocumentData): Title => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    color: data.color || '#8BD0EF',
    chipStyle: data.chipStyle,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
    rarityId: data.rarityId || null,
    categoryId: data.categoryId || null,
    originId: data.originId || null,
    collectionId: data.collectionId || null,
    order: typeof data.order === 'number' ? Math.max(0, Math.min(999, data.order)) : 0,
    linkedBadgeIds: Array.isArray(data.linkedBadgeIds) ? data.linkedBadgeIds : [],
  };
};

const countUsersWithTitleInternal = async (titleId: string): Promise<number> => {
  return countUsersWithCollectible('title', titleId);
};

const titleRepository = createCollectibleRepository<Title, TitleFormData>({
  collectionName: 'titles',
  fallbackSlug: 'titulo',
  logItemName: 'title',
  userCountErrorMessage: 'Não é possível excluir: há usuários com este título.',
  deleteErrorMessage: 'Erro ao excluir o título.',
  parse: parseTitleDoc,
  formatCreatePayload: (data) => ({
    name: data.name.trim(),
    description: data.description.trim(),
    color: data.color.trim() || '#8BD0EF',
    chipStyle: data.chipStyle || null,
    rarityId: data.rarityId || null,
    categoryId: data.categoryId || null,
    originId: data.originId || null,
    collectionId: data.collectionId || null,
    order: typeof data.order === 'number' && !isNaN(data.order) ? Math.max(0, Math.min(999, data.order)) : 0,
    linkedBadgeIds: data.linkedBadgeIds ?? [],
  }),
  formatUpdatePayload: (data) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.color !== undefined) updateData.color = data.color.trim();
    if (data.chipStyle === undefined) {
      updateData.chipStyle = deleteField();
    } else {
      updateData.chipStyle = data.chipStyle;
    }
    if (data.rarityId !== undefined) updateData.rarityId = data.rarityId || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.originId !== undefined) updateData.originId = data.originId || null;
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId || null;
    if (data.order !== undefined) {
      updateData.order = typeof data.order === 'number' && !isNaN(data.order) ? Math.max(0, Math.min(999, data.order)) : 0;
    }
    if (data.linkedBadgeIds !== undefined) {
      updateData.linkedBadgeIds = data.linkedBadgeIds;
    }
    return updateData;
  },
  clientSort: (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
  countUsersWith: countUsersWithTitleInternal,
});

export const listTitles = async (): Promise<Title[]> => titleRepository.list();

export const getTitle = async (titleId: string): Promise<Title | null> =>
  titleRepository.get(titleId);

export const createTitle = async (
  data: TitleFormData,
  createdBy: string
): Promise<{ id: string }> => titleRepository.create(data, createdBy);

export const updateTitle = async (
  titleId: string,
  data: Partial<TitleFormData>
): Promise<void> => titleRepository.update(titleId, data);

export const countUsersWithTitle = async (titleId: string): Promise<number> =>
  titleRepository.countUsersWith(titleId);

export const deleteTitle = async (
  titleId: string
): Promise<{ success: boolean; error?: string }> => titleRepository.remove(titleId);

export const listUsersWithTitle = async (titleId: string): Promise<UserWithTitleItem[]> => {
  const items = await listUsersWithCollectible('title', titleId);
  return items.map((item) => ({
    userTitle: {
      id: item.userCollectible.id,
      userId: item.userCollectible.userId,
      titleId: item.userCollectible.itemId,
      awardedAt: item.userCollectible.awardedAt,
      awardedBy: item.userCollectible.awardedBy,
    },
    user: item.user,
  }));
};

export const grantTitle = async (
  userId: string,
  titleId: string,
  awardedBy: string
): Promise<string> => {
  const result = await grantCollectible(userId, 'title', titleId, awardedBy);
  try {
    const title = await getTitle(titleId);
    if (title && Array.isArray(title.linkedBadgeIds) && title.linkedBadgeIds.length > 0) {
      await Promise.all(
        title.linkedBadgeIds.map((targetBadgeId) =>
          grantCollectible(userId, 'badge', targetBadgeId, awardedBy)
        )
      );
    }
  } catch (err) {
    console.error('Erro ao propagar ganchos do título:', err);
  }
  return result;
};

export const revokeTitle = async (userTitleId: string): Promise<void> => {
  return revokeCollectible(userTitleId);
};

export const listUserTitles = async (uid: string): Promise<UserTitle[]> => {
  const items = await listUserCollectibles(uid, 'title');
  return items.map((uc) => ({
    id: uc.id,
    userId: uc.userId,
    titleId: uc.itemId,
    awardedAt: uc.awardedAt,
    awardedBy: uc.awardedBy,
  }));
};

export const listTitlesByIds = async (ids: string[]): Promise<Title[]> => {
  if (!db || !ids || ids.length === 0) return [];
  const firestoreDb = db;
  try {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    const titlePromises = uniqueIds.map(async (id) => {
      try {
        const snap = await getDoc(doc(firestoreDb, 'titles', id));
        if (snap.exists()) {
          return parseTitleDoc(snap.id, snap.data());
        }
      } catch (err) {
        console.error(`Error loading title ${id}:`, err);
      }
      return null;
    });

    const results = await Promise.all(titlePromises);
    return results.filter((t): t is Title => t !== null);
  } catch (error) {
    console.error('Error listing titles by ids:', error);
    return [];
  }
};
