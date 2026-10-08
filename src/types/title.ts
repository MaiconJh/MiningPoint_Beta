import { type Timestamp } from 'firebase/firestore';
import { type ChipStyle } from './chip';
import { type CollectibleBase } from './collectible';

export interface Title extends CollectibleBase {
  color: string;
  chipStyle?: ChipStyle;
  linkedBadgeIds?: string[];
}

export interface UserTitle {
  id: string;
  userId: string;
  titleId: string;
  awardedAt: Timestamp;
  awardedBy: string;
}
