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

export const GLOBAL_FORUM_ICON_DOC_ID = 'settings';
export const GLOBAL_FORUM_ICON_KIND = 'global-forum-icon';

export interface GlobalForumIconSetting {
  kind: typeof GLOBAL_FORUM_ICON_KIND;
  iconId: string | null;
  updatedAt: Timestamp | null;
  updatedBy: string;
}
