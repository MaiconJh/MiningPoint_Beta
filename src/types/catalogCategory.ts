import { type Timestamp } from 'firebase/firestore';

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}

export type CatalogCategoryFormData = Omit<CatalogCategory, 'id' | 'createdAt' | 'createdBy'>;
