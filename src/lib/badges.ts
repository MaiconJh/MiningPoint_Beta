import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Badge, UserBadge } from '../types/profile';

export interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
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
  };
};

export const listBadges = async (): Promise<Badge[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'badges'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    const badges: Badge[] = [];
    snap.forEach((d) => {
      badges.push(parseBadgeDoc(d.id, d.data()));
    });
    return badges;
  } catch (error) {
    console.error('Error listing badges:', error);
    return [];
  }
};

export const getBadge = async (badgeId: string): Promise<Badge | null> => {
  if (!db || !badgeId) return null;
  try {
    const snap = await getDoc(doc(db, 'badges', badgeId));
    if (!snap.exists()) return null;
    return parseBadgeDoc(snap.id, snap.data());
  } catch (error) {
    console.error(`Error getting badge ${badgeId}:`, error);
    return null;
  }
};

export const createBadge = async (
  data: BadgeFormData,
  createdBy: string
): Promise<{ id: string }> => {
  if (!db) throw new Error('Firebase DB indisponível');

  const baseId =
    data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'insignia';

  const existing = await getDoc(doc(db, 'badges', baseId));
  const docId = existing.exists() ? `${baseId}-${Date.now().toString(36)}` : baseId;

  await setDoc(doc(db, 'badges', docId), {
    name: data.name.trim(),
    description: data.description.trim(),
    icon: data.icon,
    createdAt: serverTimestamp(),
    createdBy,
  });

  return { id: docId };
};

export const updateBadge = async (
  badgeId: string,
  data: Partial<BadgeFormData>
): Promise<void> => {
  if (!db || !badgeId) throw new Error('Parâmetros inválidos');
  await updateDoc(doc(db, 'badges', badgeId), {
    ...data,
  });
};

export const countUsersWithBadge = async (badgeId: string): Promise<number> => {
  if (!db || !badgeId) return 0;
  try {
    const q = query(collection(db, 'userBadges'), where('badgeId', '==', badgeId));
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch (error) {
    console.error(`Error counting users with badge ${badgeId}:`, error);
    return 0;
  }
};

export const deleteBadge = async (
  badgeId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!db || !badgeId) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const count = await countUsersWithBadge(badgeId);
  if (count > 0) {
    return {
      success: false,
      error: 'Não é possível excluir: há usuários com esta insígnia.',
    };
  }

  try {
    await deleteDoc(doc(db, 'badges', badgeId));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting badge ${badgeId}:`, error);
    return { success: false, error: 'Erro ao excluir a insígnia.' };
  }
};

export const listUsersWithBadge = async (badgeId: string): Promise<UserWithBadgeItem[]> => {
  if (!db || !badgeId) return [];
  try {
    const q = query(collection(db, 'userBadges'), where('badgeId', '==', badgeId));
    const snap = await getDocs(q);

    const items: UserWithBadgeItem[] = [];
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
        userBadge: {
          id: docSnap.id,
          userId,
          badgeId,
          awardedAt: d.awardedAt,
          awardedBy: d.awardedBy || '',
        },
        user: userData,
      });
    }

    return items;
  } catch (error) {
    console.error(`Error listing users with badge ${badgeId}:`, error);
    return [];
  }
};

export const grantBadge = async (
  userId: string,
  badgeId: string,
  awardedBy: string
): Promise<string> => {
  if (!db || !userId || !badgeId) throw new Error('Parâmetros inválidos');
  const docId = `${userId}_${badgeId}`;
  await setDoc(doc(db, 'userBadges', docId), {
    userId,
    badgeId,
    awardedAt: serverTimestamp(),
    awardedBy,
  });
  return docId;
};

export const revokeBadge = async (userBadgeId: string): Promise<void> => {
  if (!db || !userBadgeId) throw new Error('Parâmetros inválidos');
  await deleteDoc(doc(db, 'userBadges', userBadgeId));
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
