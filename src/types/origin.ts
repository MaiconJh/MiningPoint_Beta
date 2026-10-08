import { type Timestamp } from 'firebase/firestore';

export interface Origin {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}

export type OriginFormData = Omit<Origin, 'id' | 'createdAt' | 'createdBy'>;
