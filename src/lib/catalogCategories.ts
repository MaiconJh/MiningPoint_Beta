import { type DocumentData } from 'firebase/firestore';
import { CatalogCategory, CatalogCategoryFormData } from '../types/catalogCategory';
import { createCollectibleRepository } from './collectibles';

export type { CatalogCategoryFormData };

const parseCatalogCategoryDoc = (id: string, data: DocumentData): CatalogCategory => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

const categoryRepository = createCollectibleRepository<
  CatalogCategory,
  CatalogCategoryFormData
>({
  collectionName: 'catalogCategories',
  fallbackSlug: 'categoria',
  logItemName: 'category',
  userCountErrorMessage: 'Não é possível excluir: há itens associados a esta categoria.',
  deleteErrorMessage: 'Erro ao excluir a categoria.',
  parse: parseCatalogCategoryDoc,
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

export const listCatalogCategories = async (): Promise<CatalogCategory[]> =>
  categoryRepository.list();

export const getCatalogCategory = async (
  categoryId: string
): Promise<CatalogCategory | null> => categoryRepository.get(categoryId);

export const createCatalogCategory = async (
  data: CatalogCategoryFormData,
  createdBy: string
): Promise<{ id: string }> => categoryRepository.create(data, createdBy);

export const updateCatalogCategory = async (
  categoryId: string,
  data: Partial<CatalogCategoryFormData>
): Promise<void> => categoryRepository.update(categoryId, data);

export const deleteCatalogCategory = async (
  categoryId: string
): Promise<{ success: boolean; error?: string }> =>
  categoryRepository.remove(categoryId);
