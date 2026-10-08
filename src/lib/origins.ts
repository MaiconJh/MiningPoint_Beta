import { type DocumentData } from 'firebase/firestore';
import { Origin, OriginFormData } from '../types/origin';
import { createCollectibleRepository } from './collectibles';

export type { OriginFormData };

const parseOriginDoc = (id: string, data: DocumentData): Origin => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

const originRepository = createCollectibleRepository<Origin, OriginFormData>({
  collectionName: 'origins',
  fallbackSlug: 'origem',
  logItemName: 'origin',
  userCountErrorMessage: 'Não é possível excluir: há itens associados a esta origem.',
  deleteErrorMessage: 'Erro ao excluir a origem.',
  parse: parseOriginDoc,
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

export const listOrigins = async (): Promise<Origin[]> => originRepository.list();

export const getOrigin = async (originId: string): Promise<Origin | null> =>
  originRepository.get(originId);

export const createOrigin = async (
  data: OriginFormData,
  createdBy: string
): Promise<{ id: string }> => originRepository.create(data, createdBy);

export const updateOrigin = async (
  originId: string,
  data: Partial<OriginFormData>
): Promise<void> => originRepository.update(originId, data);

export const deleteOrigin = async (
  originId: string
): Promise<{ success: boolean; error?: string }> => originRepository.remove(originId);
