import { type Timestamp } from 'firebase/firestore';
import { type ChipStyle } from './chip';

export interface GroupAdminPermissions {
  accessPanel: boolean;
  manageUsers: boolean;
  manageGroups: boolean;
  manageBadges: boolean;
  manageForum: boolean;
  manageContent: boolean;
  manageCatalogs: boolean;
}

export interface GroupPermissions {
  admin: GroupAdminPermissions;
  forum: {
    categories?: Record<string, unknown>;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  priority: number;
  isStaff: boolean;
  isDefault: boolean;
  permissions: GroupPermissions;
  chipStyle?: ChipStyle;
  createdAt: Timestamp;
  createdBy: string;
}

export type GroupFormData = Omit<Group, 'id' | 'createdAt' | 'createdBy'>;
