import { type Timestamp } from 'firebase/firestore';
import { type ChipStyle } from './chip';

export interface Title {
  id: string;
  name: string;
  description: string;
  color: string;
  chipStyle?: ChipStyle;
  createdAt: Timestamp;
  createdBy: string;
}

export interface UserTitle {
  id: string;
  userId: string;
  titleId: string;
  awardedAt: Timestamp;
  awardedBy: string;
}
