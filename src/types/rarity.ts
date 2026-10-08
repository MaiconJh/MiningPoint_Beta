import { type Timestamp } from 'firebase/firestore';

export interface Rarity {
  id: string;
  label: string;
  color: string;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}

export type RarityFormData = Omit<Rarity, 'id' | 'createdAt' | 'createdBy'>;
