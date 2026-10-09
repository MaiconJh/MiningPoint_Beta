// IDs gerados via crypto.randomUUID() para evitar colisões sem depender de slug
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Rarity, RarityFormData } from '../types/rarity';

export type { RarityFormData };

const parseRarityDoc = (id: string, data: DocumentData): Rarity => {
  return {
    id,
    label: data.label || '',
    color: data.color || '#8BD0EF',
    order: typeof data.order === 'number' ? data.order : 0,
    theme: data.theme || undefined,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

export const listRarities = async (): Promise<Rarity[]> => {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'rarities'));
    const items: Rarity[] = [];
    snap.forEach((d) => {
      items.push(parseRarityDoc(d.id, d.data()));
    });
    // Ordenação client-side por ordem crescente e rótulo crescente
    items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
    return items;
  } catch (error) {
    console.error('Error listing rarities:', error);
    return [];
  }
};

export const getRarity = async (rarityId: string): Promise<Rarity | null> => {
  if (!db || !rarityId) return null;
  try {
    const snap = await getDoc(doc(db, 'rarities', rarityId));
    if (!snap.exists()) return null;
    return parseRarityDoc(snap.id, snap.data());
  } catch (error) {
    console.error(`Error getting rarity ${rarityId}:`, error);
    return null;
  }
};

export const createRarity = async (
  data: RarityFormData,
  createdBy: string
): Promise<{ id: string }> => {
  if (!db) throw new Error('Firebase DB indisponível');

  const docId = crypto.randomUUID();

  await setDoc(doc(db, 'rarities', docId), {
    label: data.label.trim(),
    color: data.color.trim() || '#8BD0EF',
    order: typeof data.order === 'number' ? data.order : 0,
    theme: data.theme || null,
    createdAt: serverTimestamp(),
    createdBy,
  });

  return { id: docId };
};

export const updateRarity = async (
  rarityId: string,
  data: Partial<RarityFormData>
): Promise<void> => {
  if (!db || !rarityId) throw new Error('Parâmetros inválidos');

  const updatePayload: Record<string, unknown> = {};
  if (data.label !== undefined) updatePayload.label = data.label.trim();
  if (data.color !== undefined) updatePayload.color = data.color.trim();
  if (data.order !== undefined) updatePayload.order = Number(data.order);
  if (data.theme === undefined) {
    updatePayload.theme = deleteField();
  } else {
    updatePayload.theme = data.theme || null;
  }

  await updateDoc(doc(db, 'rarities', rarityId), updatePayload);
};

export const deleteRarity = async (
  rarityId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!db || !rarityId) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  try {
    await deleteDoc(doc(db, 'rarities', rarityId));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting rarity ${rarityId}:`, error);
    return { success: false, error: 'Erro ao excluir a raridade.' };
  }
};
