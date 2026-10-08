import { type Timestamp } from 'firebase/firestore';

export interface NamedCollection {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}

export type CollectionFormData = Omit<NamedCollection, 'id' | 'createdAt' | 'createdBy'>;
