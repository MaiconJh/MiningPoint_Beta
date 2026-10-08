import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Title, UserTitle } from '../types/title';
import { ChipStyle } from '../types/chip';
import { createCollectibleRepository } from './collectibles';

export interface TitleFormData {
  name: string;
  description: string;
  color: string;
  chipStyle?: ChipStyle;
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
  };
};

const countUsersWithTitleInternal = async (titleId: string): Promise<number> => {
  if (!db || !titleId) return 0;
  try {
    const q = query(collection(db, 'userTitles'), where('titleId', '==', titleId));
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch (error) {
    console.error(`Error counting users with title ${titleId}:`, error);
    return 0;
  }
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
  }),
  formatUpdatePayload: (data) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.chipStyle === undefined) {
      updateData.chipStyle = deleteField();
    }
    return updateData;
  },
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
  if (!db || !titleId) return [];
  try {
    const q = query(collection(db, 'userTitles'), where('titleId', '==', titleId));
    const snap = await getDocs(q);

    const items: UserWithTitleItem[] = [];
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const userId = d.userId || '';
      let userData = {
        uid: userId,
        displayName: 'Usuário',
        email: '',
        photoURL: null,
      };

      if (userId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', userId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            userData = {
              uid: userSnap.id,
              displayName: u.displayName || 'Usuário',
              email: u.email || '',
              photoURL: u.photoURL || null,
            };
          }
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
        }
      }

      items.push({
        userTitle: {
          id: docSnap.id,
          userId,
          titleId,
          awardedAt: d.awardedAt,
          awardedBy: d.awardedBy || '',
        },
        user: userData,
      });
    }

    return items;
  } catch (error) {
    console.error(`Error listing users with title ${titleId}:`, error);
    return [];
  }
};

export const grantTitle = async (
  userId: string,
  titleId: string,
  awardedBy: string
): Promise<string> => {
  if (!db || !userId || !titleId) throw new Error('Parâmetros inválidos');
  const docId = `${userId}_${titleId}`;
  await setDoc(doc(db, 'userTitles', docId), {
    userId,
    titleId,
    awardedAt: serverTimestamp(),
    awardedBy,
  });
  return docId;
};

export const revokeTitle = async (userTitleId: string): Promise<void> => {
  if (!db || !userTitleId) throw new Error('Parâmetros inválidos');
  await deleteDoc(doc(db, 'userTitles', userTitleId));
};

export const listUserTitles = async (uid: string): Promise<UserTitle[]> => {
  if (!db || !uid) return [];
  try {
    const q = query(collection(db, 'userTitles'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const list: UserTitle[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: d.userId || uid,
        titleId: d.titleId || '',
        awardedAt: d.awardedAt,
        awardedBy: d.awardedBy || '',
      });
    });
    return list;
  } catch (error) {
    console.error('Error fetching user titles:', error);
    return [];
  }
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
