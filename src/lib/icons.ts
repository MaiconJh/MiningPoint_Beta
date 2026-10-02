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
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { CustomIcon, CustomIconFormData } from '../types/icon';
import { CategoryKey } from '../data/icons/categories';

const parseCustomIconDoc = (id: string, data: DocumentData): CustomIcon => {
  return {
    id,
    name: data.name || '',
    category: (data.category as CategoryKey) || 'general',
    tags: Array.isArray(data.tags) ? data.tags : [],
    svg: data.svg || '',
    viewBox: data.viewBox || '0 0 24 24',
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

export const listCustomIcons = async (): Promise<CustomIcon[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'icons'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    const icons: CustomIcon[] = [];
    snap.forEach((d) => {
      icons.push(parseCustomIconDoc(d.id, d.data()));
    });
    return icons;
  } catch (error) {
    console.error('Error listing custom icons:', error);
    return [];
  }
};

export const getCustomIcon = async (iconId: string): Promise<CustomIcon | null> => {
  if (!db || !iconId) return null;
  try {
    const snap = await getDoc(doc(db, 'icons', iconId));
    if (!snap.exists()) return null;
    return parseCustomIconDoc(snap.id, snap.data());
  } catch (error) {
    console.error(`Error getting custom icon ${iconId}:`, error);
    return null;
  }
};

export const createCustomIcon = async (
  data: CustomIconFormData,
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
      .replace(/^-|-$/g, '') || 'icone';

  const existing = await getDoc(doc(db, 'icons', baseId));
  const docId = existing.exists() ? `${baseId}-${Date.now().toString(36)}` : baseId;

  await setDoc(doc(db, 'icons', docId), {
    name: data.name.trim(),
    category: data.category,
    tags: data.tags.map((t) => t.trim().toLowerCase()),
    svg: data.svg.trim(),
    viewBox: data.viewBox || '0 0 24 24',
    createdAt: serverTimestamp(),
    createdBy,
  });

  return { id: docId };
};

export const updateCustomIcon = async (
  iconId: string,
  data: Partial<Pick<CustomIconFormData, 'name' | 'category' | 'tags'>>
): Promise<void> => {
  if (!db || !iconId) throw new Error('Parâmetros inválidos');

  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.tags !== undefined) {
    updatePayload.tags = data.tags.map((t) => t.trim().toLowerCase());
  }

  await updateDoc(doc(db, 'icons', iconId), updatePayload);
};

export const isIconInUse = async (iconId: string): Promise<boolean> => {
  if (!db || !iconId) return false;
  try {
    const customRef = `custom:${iconId}`;
    const q = query(collection(db, 'badges'), where('icon', '==', customRef), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error(`Error checking if icon ${iconId} is in use:`, error);
    return false;
  }
};

export const deleteCustomIcon = async (
  iconId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!db || !iconId) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const inUse = await isIconInUse(iconId);
  if (inUse) {
    return {
      success: false,
      error: 'Não é possível excluir: há badges usando este ícone.',
    };
  }

  try {
    await deleteDoc(doc(db, 'icons', iconId));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting icon ${iconId}:`, error);
    return { success: false, error: 'Erro ao excluir o ícone.' };
  }
};
