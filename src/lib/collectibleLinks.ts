import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { CollectibleKind } from '../types/collectible';

export interface UserCollectible {
  id: string;
  userId: string;
  kind: CollectibleKind;
  itemId: string;
  awardedAt: Timestamp;
  awardedBy: string;
}

export interface UserWithCollectibleItem {
  userCollectible: UserCollectible;
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
  };
}

/**
 * Concede um colecionável (insígnia ou título) para o usuário especificado.
 */
export const grantCollectible = async (
  userId: string,
  kind: CollectibleKind,
  itemId: string,
  awardedBy: string
): Promise<string> => {
  if (!db || !userId || !itemId) throw new Error('Parâmetros inválidos');
  const docId = `${userId}_${kind}_${itemId}`;
  await setDoc(doc(db, 'userCollectibles', docId), {
    userId,
    kind,
    itemId,
    awardedAt: serverTimestamp(),
    awardedBy,
  });
  return docId;
};

/**
 * Revoga um vínculo de colecionável pelo ID do documento.
 */
export const revokeCollectible = async (userCollectibleId: string): Promise<void> => {
  if (!db || !userCollectibleId) throw new Error('Parâmetros inválidos');
  await deleteDoc(doc(db, 'userCollectibles', userCollectibleId));
};

/**
 * Conta quantos usuários possuem determinado colecionável.
 */
export const countUsersWithCollectible = async (
  kind: CollectibleKind,
  itemId: string
): Promise<number> => {
  if (!db || !itemId) return 0;
  try {
    const q = query(
      collection(db, 'userCollectibles'),
      where('kind', '==', kind),
      where('itemId', '==', itemId)
    );
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch (error) {
    console.error(`Erro ao contar usuários com ${kind} ${itemId}:`, error);
    return 0;
  }
};

/**
 * Lista todos os usuários que possuem determinado colecionável com dados cadastrais básicos.
 */
export const listUsersWithCollectible = async (
  kind: CollectibleKind,
  itemId: string
): Promise<UserWithCollectibleItem[]> => {
  if (!db || !itemId) return [];
  try {
    const q = query(
      collection(db, 'userCollectibles'),
      where('kind', '==', kind),
      where('itemId', '==', itemId)
    );
    const snap = await getDocs(q);

    const items: UserWithCollectibleItem[] = [];
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const userId = d.userId || '';
      let userData = {
        uid: userId,
        displayName: 'Usuário',
        email: '',
        photoURL: null as string | null,
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
          console.error(`Erro ao carregar usuário ${userId}:`, err);
        }
      }

      items.push({
        userCollectible: {
          id: docSnap.id,
          userId,
          kind: (d.kind as CollectibleKind) || kind,
          itemId: d.itemId || itemId,
          awardedAt: d.awardedAt,
          awardedBy: d.awardedBy || '',
        },
        user: userData,
      });
    }

    return items;
  } catch (error) {
    console.error(`Erro ao listar usuários com ${kind} ${itemId}:`, error);
    return [];
  }
};

/**
 * Lista os colecionáveis de um usuário, opcionalmente filtrando por tipo.
 */
export const listUserCollectibles = async (
  uid: string,
  kind?: CollectibleKind
): Promise<UserCollectible[]> => {
  if (!db || !uid) return [];
  try {
    const constraints = [where('userId', '==', uid)];
    if (kind) {
      constraints.push(where('kind', '==', kind));
    }
    const q = query(collection(db, 'userCollectibles'), ...constraints);
    const snap = await getDocs(q);
    const list: UserCollectible[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: d.userId || uid,
        kind: (d.kind as CollectibleKind) || (kind ?? 'badge'),
        itemId: d.itemId || '',
        awardedAt: d.awardedAt,
        awardedBy: d.awardedBy || '',
      });
    });
    return list;
  } catch (error) {
    console.error(`Erro ao buscar colecionáveis do usuário ${uid}:`, error);
    return [];
  }
};
