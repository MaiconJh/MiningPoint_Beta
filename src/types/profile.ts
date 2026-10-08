import { type Timestamp } from 'firebase/firestore';
import { type Group } from './group';
import { type EffectivePermissions } from '../lib/permissions';
import { type Title, type UserTitle } from './title';
import { type CollectibleBase } from './collectible';

export type { Title, UserTitle };

export type UserVisibility = 'public' | 'private';

export interface UserAttributes {
  exploration: number;
  gathering: number;
  knowledge: number;
  community: number;
  endurance: number;
  economy: number;
}

export type AttributeKey = keyof UserAttributes;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  shortId: string;
  handle: string | null;
  hasRedefinedHandle?: boolean;
  primaryGroupId: string;
  secondaryGroupIds: string[];
  isStaff: boolean;
  effectivePermissions: EffectivePermissions;
  group?: Group | null;
  primaryGroup?: Group | null;
  secondaryGroups?: Group[];
  bio: string;
  featuredTitleId: string | null;
  featuredTitle?: Title | null;
  visibility: UserVisibility;
  featuredBadges: string[];
  attributes: UserAttributes;
  isBanned?: boolean;
  bannedAt?: Timestamp | Date | string | null;
  bannedBy?: string | null;
  createdAt: Timestamp;
}

export interface Badge extends CollectibleBase {
  icon: string;
  linkedTitleIds?: string[];
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: Timestamp;
  awardedBy: string;
}

export interface FeaturedBadgeItem {
  badge: Badge;
  userBadge: UserBadge;
}
