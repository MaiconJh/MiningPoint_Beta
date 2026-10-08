import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  Badge,
  UserBadge,
  FeaturedBadgeItem,
  UserAttributes,
} from '../types/profile';
import { Title } from '../types/title';
import { getGroup } from './groups';
import {
  unionUserPermissions,
  deriveIsStaff,
} from './permissions';
import { Group } from '../types/group';
import { listUserCollectibles } from './collectibleLinks';

export const DEFAULT_ATTRIBUTES: UserAttributes = {
  exploration: 0,
  gathering: 0,
  knowledge: 0,
  community: 0,
  endurance: 0,
  economy: 0,
};

export const normalizeUserProfile = (data: DocumentData, uid: string): UserProfile => {
  const rawAttrs = data.attributes || {};
  const attributes: UserAttributes = {
    exploration: typeof rawAttrs.exploration === 'number' ? rawAttrs.exploration : 0,
    gathering: typeof rawAttrs.gathering === 'number' ? rawAttrs.gathering : 0,
    knowledge: typeof rawAttrs.knowledge === 'number' ? rawAttrs.knowledge : 0,
    community: typeof rawAttrs.community === 'number' ? rawAttrs.community : 0,
    endurance: typeof rawAttrs.endurance === 'number' ? rawAttrs.endurance : 0,
    economy: typeof rawAttrs.economy === 'number' ? rawAttrs.economy : 0,
  };

  // Resolve primaryGroupId from primaryGroupId -> groupId -> level -> 'visitante'
  let primaryGroupId = 'visitante';
  if (typeof data.primaryGroupId === 'string' && data.primaryGroupId.trim()) {
    primaryGroupId = data.primaryGroupId.trim().toLowerCase();
  } else if (typeof data.groupId === 'string' && data.groupId.trim()) {
    primaryGroupId = data.groupId.trim().toLowerCase();
  } else if (typeof data.level === 'string' && data.level.trim()) {
    primaryGroupId = data.level.trim().toLowerCase();
  }

  const secondaryGroupIds: string[] = Array.isArray(data.secondaryGroupIds)
    ? data.secondaryGroupIds.filter((id): id is string => typeof id === 'string')
    : [];

  const rawPerms = data.effectivePermissions || {};
  const effectivePermissions = {
    accessPanel: !!rawPerms.accessPanel,
    manageUsers: !!rawPerms.manageUsers,
    manageGroups: !!rawPerms.manageGroups,
    manageBadges: !!rawPerms.manageBadges,
    manageForum: !!rawPerms.manageForum,
    manageContent: !!rawPerms.manageContent,
    manageCatalogs: !!rawPerms.manageCatalogs,
  };

  return {
    uid: data.uid || uid,
    displayName: data.displayName || '',
    email: data.email || '',
    photoURL: data.photoURL || null,
    shortId: typeof data.shortId === 'string' ? data.shortId : '',
    handle: typeof data.handle === 'string' && data.handle ? data.handle : null,
    hasRedefinedHandle: data.hasRedefinedHandle === true,
    primaryGroupId,
    secondaryGroupIds,
    isStaff: typeof data.isStaff === 'boolean' ? data.isStaff : false,
    effectivePermissions,
    group: null,
    primaryGroup: null,
    secondaryGroups: [],
    bio: data.bio || '',
    featuredTitleId: typeof data.featuredTitleId === 'string' && data.featuredTitleId ? data.featuredTitleId : null,
    featuredTitle: null,
    visibility: data.visibility === 'private' ? 'private' : 'public',
    featuredBadges: Array.isArray(data.featuredBadges) ? data.featuredBadges : [],
    attributes,
    isBanned: typeof data.isBanned === 'boolean' ? data.isBanned : false,
    bannedAt: data.bannedAt ?? null,
    bannedBy: data.bannedBy ?? null,
    createdAt: data.createdAt,
  };
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    const profile = normalizeUserProfile(data, uid);

    // Resolve primary group
    let primaryGroup: Group | null = null;
    if (profile.primaryGroupId) {
      try {
        primaryGroup = await getGroup(profile.primaryGroupId);
      } catch (err) {
        console.error(`Error resolving primary group ${profile.primaryGroupId}:`, err);
      }
    }

    // Resolve secondary groups
    const secondaryGroups: Group[] = [];
    if (profile.secondaryGroupIds.length > 0) {
      const results = await Promise.all(
        profile.secondaryGroupIds.map((id) => getGroup(id).catch(() => null))
      );
      results.forEach((g) => {
        if (g) secondaryGroups.push(g);
      });
    }

    const allGroups = primaryGroup ? [primaryGroup, ...secondaryGroups] : [...secondaryGroups];

    // If derived fields are not yet saved or populated, compute them dynamically
    if (!data.effectivePermissions) {
      profile.effectivePermissions = unionUserPermissions(allGroups);
    }
    if (typeof data.isStaff !== 'boolean') {
      profile.isStaff = deriveIsStaff(allGroups);
    }

    profile.group = primaryGroup;
    profile.primaryGroup = primaryGroup;
    profile.secondaryGroups = secondaryGroups;

    // Resolve featured title if set
    if (profile.featuredTitleId) {
      try {
        const titleSnap = await getDoc(doc(db, 'titles', profile.featuredTitleId));
        if (titleSnap.exists()) {
          const tData = titleSnap.data();
          profile.featuredTitle = {
            id: titleSnap.id,
            name: tData.name || '',
            description: tData.description || '',
            color: tData.color || '#8BD0EF',
            chipStyle: tData.chipStyle,
            createdAt: tData.createdAt,
            createdBy: tData.createdBy || '',
          } as Title;
        } else {
          profile.featuredTitle = null;
        }
      } catch (titleErr) {
        console.error(`Error resolving featured title ${profile.featuredTitleId}:`, titleErr);
        profile.featuredTitle = null;
      }
    }

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const listUserBadges = async (uid: string): Promise<UserBadge[]> => {
  const items = await listUserCollectibles(uid, 'badge');
  return items.map((uc) => ({
    id: uc.id,
    userId: uc.userId,
    badgeId: uc.itemId,
    awardedAt: uc.awardedAt,
    awardedBy: uc.awardedBy,
  }));
};

export const listBadgesByIds = async (ids: string[]): Promise<Badge[]> => {
  if (!db || !ids || ids.length === 0) return [];
  const firestoreDb = db;
  try {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    const badgePromises = uniqueIds.map(async (id) => {
      try {
        const snap = await getDoc(doc(firestoreDb, 'badges', id));
        if (snap.exists()) {
          const d = snap.data();
          return {
            id: snap.id,
            name: d.name || '',
            description: d.description || '',
            icon: d.icon || 'award',
            createdAt: d.createdAt,
            createdBy: d.createdBy || '',
          } as Badge;
        }
      } catch (err) {
        console.error(`Error loading badge ${id}:`, err);
      }
      return null;
    });

    const results = await Promise.all(badgePromises);
    return results.filter((b): b is Badge => b !== null);
  } catch (error) {
    console.error('Error listing badges by ids:', error);
    return [];
  }
};

export const getFeaturedBadgeItems = async (
  uid: string,
  featuredBadgeIds: string[]
): Promise<FeaturedBadgeItem[]> => {
  if (!uid || !featuredBadgeIds || featuredBadgeIds.length === 0) return [];
  try {
    const [userBadges, badges] = await Promise.all([
      listUserBadges(uid),
      listBadgesByIds(featuredBadgeIds),
    ]);

    const userBadgeMap = new Map<string, UserBadge>();
    userBadges.forEach((ub) => {
      userBadgeMap.set(ub.badgeId, ub);
    });

    const badgeMap = new Map<string, Badge>();
    badges.forEach((b) => {
      badgeMap.set(b.id, b);
    });

    const items: FeaturedBadgeItem[] = [];
    for (const badgeId of featuredBadgeIds) {
      const badge = badgeMap.get(badgeId);
      const userBadge = userBadgeMap.get(badgeId);
      if (badge && userBadge) {
        items.push({ badge, userBadge });
      }
    }
    return items;
  } catch (error) {
    console.error('Error assembling featured badge items:', error);
    return [];
  }
};
