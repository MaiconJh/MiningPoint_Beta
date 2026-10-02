import { type Timestamp } from 'firebase/firestore';
import { CategoryKey } from '../data/icons/categories';

export interface CustomIcon {
  id: string;
  name: string;
  category: CategoryKey;
  tags: string[];
  svg: string;
  viewBox: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface CustomIconFormData {
  name: string;
  category: CategoryKey;
  tags: string[];
  svg: string;
  viewBox: string;
}
