import { type DocumentData } from 'firebase/firestore';
import { NamedCollection, CollectionFormData } from '../types/collection';
import { createCollectibleRepository } from './collectibles';

export type { CollectionFormData };

const parseCollectionDoc = (id: string, data: DocumentData): NamedCollection => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

const collectionRepository = createCollectibleRepository<
  NamedCollection,
  CollectionFormData
>({
  collectionName: 'collections',
  fallbackSlug: 'colecao',
  logItemName: 'collection',
  userCountErrorMessage: 'Não é possível excluir: há itens associados a esta coleção.',
  deleteErrorMessage: 'Erro ao excluir a coleção.',
  parse: parseCollectionDoc,
  formatCreatePayload: (data) => ({
    name: data.name.trim(),
    description: data.description.trim(),
    order: typeof data.order === 'number' ? data.order : 0,
  }),
  formatUpdatePayload: (data) => {
    const payload: Record<string, unknown> = { ...data };
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.order !== undefined) payload.order = Number(data.order);
    return payload;
  },
  clientSort: (a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  },
});

export const listCollections = async (): Promise<NamedCollection[]> =>
  collectionRepository.list();

export const getCollection = async (
  collectionId: string
): Promise<NamedCollection | null> => collectionRepository.get(collectionId);

export const createCollection = async (
  data: CollectionFormData,
  createdBy: string
): Promise<{ id: string }> => collectionRepository.create(data, createdBy);

export const updateCollection = async (
  collectionId: string,
  data: Partial<CollectionFormData>
): Promise<void> => collectionRepository.update(collectionId, data);

export const deleteCollection = async (
  collectionId: string
): Promise<{ success: boolean; error?: string }> =>
  collectionRepository.remove(collectionId);
