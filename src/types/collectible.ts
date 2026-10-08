import { type Timestamp } from 'firebase/firestore';

export type CollectibleKind = 'badge' | 'title';

export interface CollectibleBase {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  createdBy: string;
  // Campos de referência ao catálogo e ordenação
  rarityId?: string | null;
  categoryId?: string | null;
  originId?: string | null;
  collectionId?: string | null;
  order?: number;
}
