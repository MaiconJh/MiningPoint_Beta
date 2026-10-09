import { type Timestamp } from 'firebase/firestore';
import { EffectStack } from '../lib/effects/types';

export interface Rarity {
  id: string;
  label: string;
  color: string;
  order: number;
  theme?: EffectStack;
  createdAt: Timestamp;
  createdBy: string;
}

export type RarityFormData = Omit<Rarity, 'id' | 'createdAt' | 'createdBy'>;
