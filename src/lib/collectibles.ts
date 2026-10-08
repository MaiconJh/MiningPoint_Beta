import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { type CollectibleBase } from '../types/collectible';

export interface CollectibleRepositoryOptions<
  T extends CollectibleBase,
  TFormData extends { name: string }
> {
  collectionName: string;
  fallbackSlug: string;
  parse: (id: string, data: DocumentData) => T;
  formatCreatePayload: (data: TFormData, createdBy: string) => Record<string, unknown>;
  formatUpdatePayload?: (data: Partial<TFormData>) => Record<string, unknown>;
  countUsersWith?: (id: string) => Promise<number>;
  userCountErrorMessage?: string;
  deleteErrorMessage?: string;
  logItemName?: string;
}

export interface CollectibleRepository<
  T extends CollectibleBase,
  TFormData extends { name: string }
> {
  list: () => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (data: TFormData, createdBy: string) => Promise<{ id: string }>;
  update: (id: string, data: Partial<TFormData>) => Promise<void>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  countUsersWith: (id: string) => Promise<number>;
}

/**
 * Fábrica genérica para gerenciamento de colecionáveis (insígnias e títulos).
 */
export function createCollectibleRepository<
  T extends CollectibleBase,
  TFormData extends { name: string }
>(
  options: CollectibleRepositoryOptions<T, TFormData>
): CollectibleRepository<T, TFormData> {
  const countUsersWith = async (id: string): Promise<number> => {
    if (!db || !id) return 0;
    if (options.countUsersWith) {
      return options.countUsersWith(id);
    }
    return 0;
  };

  const list = async (): Promise<T[]> => {
    if (!db) return [];
    try {
      const q = query(
        collection(db, options.collectionName),
        orderBy('name', 'asc')
      );
      const snap = await getDocs(q);
      const items: T[] = [];
      snap.forEach((d) => {
        items.push(options.parse(d.id, d.data()));
      });
      return items;
    } catch (error) {
      console.error(`Error listing ${options.collectionName}:`, error);
      return [];
    }
  };

  const get = async (id: string): Promise<T | null> => {
    if (!db || !id) return null;
    try {
      const snap = await getDoc(doc(db, options.collectionName, id));
      if (!snap.exists()) return null;
      return options.parse(snap.id, snap.data());
    } catch (error) {
      const logName = options.logItemName || options.collectionName;
      console.error(`Error getting ${logName} ${id}:`, error);
      return null;
    }
  };

  const create = async (
    data: TFormData,
    createdBy: string
  ): Promise<{ id: string }> => {
    if (!db) throw new Error('Firebase DB indisponível');

    const rawName = data.name || '';
    const baseId =
      rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || options.fallbackSlug;

    const existing = await getDoc(doc(db, options.collectionName, baseId));
    const docId = existing.exists()
      ? `${baseId}-${Date.now().toString(36)}`
      : baseId;

    const payload = options.formatCreatePayload(data, createdBy);

    await setDoc(doc(db, options.collectionName, docId), {
      ...payload,
      createdAt: serverTimestamp(),
      createdBy,
    });

    return { id: docId };
  };

  const update = async (
    id: string,
    data: Partial<TFormData>
  ): Promise<void> => {
    if (!db || !id) throw new Error('Parâmetros inválidos');
    const updatePayload = options.formatUpdatePayload
      ? options.formatUpdatePayload(data)
      : { ...data };
    await updateDoc(doc(db, options.collectionName, id), updatePayload);
  };

  const remove = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!db || !id) {
      return { success: false, error: 'Parâmetros inválidos.' };
    }

    const count = await countUsersWith(id);
    if (count > 0) {
      return {
        success: false,
        error:
          options.userCountErrorMessage ||
          'Não é possível excluir: há usuários com este item.',
      };
    }

    try {
      await deleteDoc(doc(db, options.collectionName, id));
      return { success: true };
    } catch (error) {
      const logName = options.logItemName || options.collectionName;
      console.error(`Error deleting ${logName} ${id}:`, error);
      return {
        success: false,
        error: options.deleteErrorMessage || 'Erro ao excluir o item.',
      };
    }
  };

  return {
    list,
    get,
    create,
    update,
    remove,
    countUsersWith,
  };
}
