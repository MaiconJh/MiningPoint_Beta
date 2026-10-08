import { type Timestamp } from 'firebase/firestore';

export type CollectibleKind = 'badge' | 'title';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface CollectibleBase {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  createdBy: string;
  // Campos opcionais adicionados para as fases seguintes. NÃO são gravados no Firestore nesta fase.
  rarity?: Rarity;
  categoryId?: string;
  origin?: string;
  collectionId?: string;
  order?: number;
}
