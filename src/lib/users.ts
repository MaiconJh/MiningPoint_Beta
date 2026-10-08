import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  type DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserAttributes } from '../types/profile';
import { Group } from '../types/group';
import { listGroups, getGroup } from './groups';
import { normalizeUserProfile, getUserProfile } from './profile';
import { deriveIsStaff, unionUserPermissions } from './permissions';
import { validateHandle } from './handle';
import { ensureUniqueShortId } from './shortId';

export interface ListUsersOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot | null;
  groupId?: string | null;
  searchQuery?: string | null;
}

export interface ListUsersResult {
  users: UserProfile[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const listUsers = async (options: ListUsersOptions = {}): Promise<ListUsersResult> => {
  if (!db) return { users: [], lastDoc: null, hasMore: false };

  const pageSize = options.limitCount || 25;
  const rawQuery = options.searchQuery?.trim();
  const selectedGroupId = options.groupId?.trim();

  try {
    const allGroups = await listGroups();
    const groupMap = new Map<string, Group>();
    allGroups.forEach((g) => groupMap.set(g.id, g));

    let q;
    const usersRef = collection(db, 'users');

    if (rawQuery) {
      const isEmailSearch = rawQuery.includes('@');
      const searchField = isEmailSearch ? 'email' : 'displayName';

      // Use Firestore prefix range trick
      const constraints: unknown[] = [
        where(searchField, '>=', rawQuery),
        where(searchField, '<=', rawQuery + '\uf8ff'),
        orderBy(searchField, 'asc'),
        limit(pageSize + 1),
      ];

      if (options.lastDoc) {
        constraints.push(startAfter(options.lastDoc));
      }

      // @ts-expect-error query constraints spreading
      q = query(usersRef, ...constraints);
    } else {
      const constraints: unknown[] = [
        orderBy('displayName', 'asc'),
        limit(pageSize + 1),
      ];

      if (options.lastDoc) {
        constraints.push(startAfter(options.lastDoc));
      }

      // @ts-expect-error query constraints spreading
      q = query(usersRef, ...constraints);
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;
    const newLastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

    let users: UserProfile[] = pageDocs.map((d) => {
      const profile = normalizeUserProfile(d.data(), d.id);
      const primaryGroup = profile.primaryGroupId ? groupMap.get(profile.primaryGroupId) || null : null;
      const secondaryGroups: Group[] = [];
      profile.secondaryGroupIds.forEach((id) => {
        const g = groupMap.get(id);
        if (g) secondaryGroups.push(g);
      });
      profile.group = primaryGroup;
      profile.primaryGroup = primaryGroup;
      profile.secondaryGroups = secondaryGroups;
      return profile;
    });

    if (selectedGroupId && selectedGroupId !== 'all') {
      users = users.filter((u) => {
        return (
          u.primaryGroupId === selectedGroupId ||
          u.secondaryGroupIds.includes(selectedGroupId)
        );
      });
    }

    return {
      users,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return { users: [], lastDoc: null, hasMore: false };
  }
};

export const getUser = async (uid: string): Promise<UserProfile | null> => {
  return getUserProfile(uid);
};

export const recomputeUser = async (
  uid: string,
  cachedGroupMap?: Map<string, Group>
): Promise<{ isStaff: boolean; effectivePermissions: UserProfile['effectivePermissions'] } | null> => {
  if (!db || !uid) return null;

  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    let groupMap = cachedGroupMap;
    if (!groupMap) {
      const allGroups = await listGroups();
      groupMap = new Map<string, Group>();
      allGroups.forEach((g) => groupMap!.set(g.id, g));
    }

    const primaryId = data.primaryGroupId || data.groupId || 'visitante';
    const secondaryIds: string[] = Array.isArray(data.secondaryGroupIds)
      ? data.secondaryGroupIds
      : [];

    const userGroups: Group[] = [];
    const primaryG = groupMap.get(primaryId);
    if (primaryG) userGroups.push(primaryG);
    for (const sid of secondaryIds) {
      const secG = groupMap.get(sid);
      if (secG) userGroups.push(secG);
    }

    const isStaff = deriveIsStaff(userGroups);
    const effectivePermissions = unionUserPermissions(userGroups);

    await updateDoc(doc(db, 'users', uid), {
      isStaff,
      effectivePermissions,
    });

    return { isStaff, effectivePermissions };
  } catch (err) {
    console.error(`Error recomputing user ${uid}:`, err);
    return null;
  }
};

export const setPrimaryGroup = async (
  uid: string,
  primaryGroupId: string
): Promise<void> => {
  if (!db || !uid || !primaryGroupId) return;

  const allGroups = await listGroups();
  const groupMap = new Map<string, Group>();
  allGroups.forEach((g) => groupMap.set(g.id, g));

  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  let secondaryIds: string[] = Array.isArray(userData.secondaryGroupIds)
    ? userData.secondaryGroupIds
    : [];

  // Remove primaryGroupId from secondaryGroupIds if present
  secondaryIds = secondaryIds.filter((id) => id !== primaryGroupId);

  const userGroups: Group[] = [];
  const primaryG = groupMap.get(primaryGroupId);
  if (primaryG) userGroups.push(primaryG);
  for (const sid of secondaryIds) {
    const secG = groupMap.get(sid);
    if (secG) userGroups.push(secG);
  }

  const isStaff = deriveIsStaff(userGroups);
  const effectivePermissions = unionUserPermissions(userGroups);

  await updateDoc(doc(db, 'users', uid), {
    primaryGroupId,
    secondaryGroupIds: secondaryIds,
    isStaff,
    effectivePermissions,
  });
};

export const setSecondaryGroups = async (
  uid: string,
  secondaryGroupIds: string[]
): Promise<void> => {
  if (!db || !uid) return;

  const allGroups = await listGroups();
  const groupMap = new Map<string, Group>();
  allGroups.forEach((g) => groupMap.set(g.id, g));

  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const primaryId = userData.primaryGroupId || 'visitante';

  // Ensure primaryId is not in secondaryGroupIds
  const cleanSecondaryIds = Array.from(
    new Set(secondaryGroupIds.filter((id) => id !== primaryId))
  );

  const userGroups: Group[] = [];
  const primaryG = groupMap.get(primaryId);
  if (primaryG) userGroups.push(primaryG);
  for (const sid of cleanSecondaryIds) {
    const secG = groupMap.get(sid);
    if (secG) userGroups.push(secG);
  }

  const isStaff = deriveIsStaff(userGroups);
  const effectivePermissions = unionUserPermissions(userGroups);

  await updateDoc(doc(db, 'users', uid), {
    secondaryGroupIds: cleanSecondaryIds,
    isStaff,
    effectivePermissions,
  });
};

export const setAttributes = async (
  uid: string,
  attributes: UserAttributes
): Promise<void> => {
  if (!db || !uid) return;
  await updateDoc(doc(db, 'users', uid), {
    attributes,
  });
};

export const setVisibility = async (
  uid: string,
  visibility: 'public' | 'private'
): Promise<void> => {
  if (!db || !uid) return;
  await updateDoc(doc(db, 'users', uid), {
    visibility,
  });
};

export const banUser = async (uid: string, adminUid: string): Promise<void> => {
  if (!db || !uid) return;
  await updateDoc(doc(db, 'users', uid), {
    isBanned: true,
    bannedAt: serverTimestamp(),
    bannedBy: adminUid,
  });
};

export const unbanUser = async (uid: string): Promise<void> => {
  if (!db || !uid) return;
  await updateDoc(doc(db, 'users', uid), {
    isBanned: false,
    bannedAt: null,
    bannedBy: null,
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  if (!db || !uid) return;

  // 1. Delete user doc
  await deleteDoc(doc(db, 'users', uid));

  // 2. Delete all userBadges referencing uid
  try {
    const q = query(collection(db, 'userBadges'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const BATCH_SIZE = 400;
    const docs = snap.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error deleting userBadges for user ${uid}:`, err);
  }
};

export const bulkAssignGroup = async (
  uids: string[],
  groupId: string,
  mode: 'primary' | 'secondary',
  onProgress?: (done: number, total: number) => void
): Promise<{ successCount: number; failedUids: string[] }> => {
  if (!db || uids.length === 0 || !groupId) {
    return { successCount: 0, failedUids: [] };
  }

  const allGroups = await listGroups();
  const groupMap = new Map<string, Group>();
  allGroups.forEach((g) => groupMap.set(g.id, g));

  const targetGroup = groupMap.get(groupId);
  if (!targetGroup) {
    throw new Error('Grupo não encontrado');
  }

  const BATCH_SIZE = 400;
  let doneCount = 0;
  const failedUids: string[] = [];

  for (let i = 0; i < uids.length; i += BATCH_SIZE) {
    const chunk = uids.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const batchPromises = chunk.map((uid) => getDoc(doc(db!, 'users', uid)));
    const docSnaps = await Promise.all(batchPromises);

    const validUpdates: { uid: string; data: DocumentData }[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const uid = chunk[j];
      const snap = docSnaps[j];
      if (!snap.exists()) {
        failedUids.push(uid);
        continue;
      }

      const userData = snap.data();
      let primaryId = userData.primaryGroupId || userData.groupId || 'visitante';
      let secondaryIds: string[] = Array.isArray(userData.secondaryGroupIds)
        ? [...userData.secondaryGroupIds]
        : [];

      if (mode === 'primary') {
        primaryId = groupId;
        secondaryIds = secondaryIds.filter((id) => id !== groupId);
      } else {
        if (primaryId !== groupId && !secondaryIds.includes(groupId)) {
          secondaryIds.push(groupId);
        }
      }

      const userGroups: Group[] = [];
      const primaryG = groupMap.get(primaryId);
      if (primaryG) userGroups.push(primaryG);
      for (const sid of secondaryIds) {
        const secG = groupMap.get(sid);
        if (secG) userGroups.push(secG);
      }

      const isStaff = deriveIsStaff(userGroups);
      const effectivePermissions = unionUserPermissions(userGroups);

      batch.update(doc(db!, 'users', uid), {
        primaryGroupId: primaryId,
        secondaryGroupIds: secondaryIds,
        isStaff,
        effectivePermissions,
      });

      validUpdates.push({ uid, data: userData });
    }

    try {
      await batch.commit();
      doneCount += validUpdates.length;
      if (onProgress) {
        onProgress(doneCount, uids.length);
      }
    } catch (batchErr) {
      console.error('Batch commit failed for chunk:', batchErr);
      validUpdates.forEach((u) => failedUids.push(u.uid));
    }
  }

  return { successCount: doneCount, failedUids };
};

export const recomputeAllUsers = async (
  onProgress?: (done: number, total: number) => void
): Promise<{ syncedCount: number; unchangedCount: number; totalCount: number }> => {
  if (!db) return { syncedCount: 0, unchangedCount: 0, totalCount: 0 };

  const allGroups = await listGroups();
  const groupMap = new Map<string, Group>();
  allGroups.forEach((g) => groupMap.set(g.id, g));

  const usersSnap = await getDocs(collection(db, 'users'));
  const allDocs = usersSnap.docs;
  const totalCount = allDocs.length;

  let syncedCount = 0;
  let unchangedCount = 0;
  let processedCount = 0;

  const BATCH_SIZE = 400;

  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let batchHasUpdates = false;

    for (const d of chunk) {
      const data = d.data();
      const primaryId = data.primaryGroupId || data.groupId || 'visitante';
      const secondaryIds: string[] = Array.isArray(data.secondaryGroupIds)
        ? data.secondaryGroupIds
        : [];

      const userGroups: Group[] = [];
      const primaryG = groupMap.get(primaryId);
      if (primaryG) userGroups.push(primaryG);
      for (const sid of secondaryIds) {
        const secG = groupMap.get(sid);
        if (secG) userGroups.push(secG);
      }

      const newIsStaff = deriveIsStaff(userGroups);
      const newPerms = unionUserPermissions(userGroups);

      // Check if derived fields changed
      const currentStaff = !!data.isStaff;
      const currentPerms = data.effectivePermissions || {};
      const permsChanged =
        currentPerms.accessPanel !== newPerms.accessPanel ||
        currentPerms.manageUsers !== newPerms.manageUsers ||
        currentPerms.manageGroups !== newPerms.manageGroups ||
        currentPerms.manageBadges !== newPerms.manageBadges ||
        currentPerms.manageForum !== newPerms.manageForum ||
        currentPerms.manageContent !== newPerms.manageContent;

      if (currentStaff !== newIsStaff || permsChanged) {
        batch.update(d.ref, {
          isStaff: newIsStaff,
          effectivePermissions: newPerms,
        });
        batchHasUpdates = true;
        syncedCount++;
      } else {
        unchangedCount++;
      }

      processedCount++;
    }

    if (batchHasUpdates) {
      try {
        await batch.commit();
      } catch (err) {
        console.error('Error committing recompute batch:', err);
      }
    }

    if (onProgress) {
      onProgress(processedCount, totalCount);
    }
  }

  return { syncedCount, unchangedCount, totalCount };
};

const checkHandleUniqueness = async (uid: string, handle: string): Promise<void> => {
  if (!db) throw new Error('Banco de dados indisponível.');

  const usersRef = collection(db, 'users');

  // Query 1: check where handle == h
  const handleQuery = query(usersRef, where('handle', '==', handle));
  const handleSnap = await getDocs(handleQuery);
  for (const docSnap of handleSnap.docs) {
    if (docSnap.id !== uid) {
      throw new Error('Este @nick já está em uso por outro usuário.');
    }
  }

  // Query 2: check where shortId == h
  const shortIdQuery = query(usersRef, where('shortId', '==', handle));
  const shortIdSnap = await getDocs(shortIdQuery);
  for (const docSnap of shortIdSnap.docs) {
    if (docSnap.id !== uid) {
      throw new Error('Este @nick coincide com o identificador de outro usuário.');
    }
  }
};

export const setHandle = async (uid: string, rawHandle: string): Promise<void> => {
  if (!db || !uid) throw new Error('Parâmetros inválidos.');

  const validation = validateHandle(rawHandle);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const h = validation.handle;
  await checkHandleUniqueness(uid, h);

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { handle: h });
};

export const redefineHandle = async (uid: string, rawHandle: string): Promise<void> => {
  if (!db || !uid) throw new Error('Parâmetros inválidos.');

  const validation = validateHandle(rawHandle);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const h = validation.handle;

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('Usuário não encontrado.');
  }

  if (userSnap.data().hasRedefinedHandle === true) {
    throw new Error('Você já utilizou sua única redefinição de @nick.');
  }

  await checkHandleUniqueness(uid, h);

  await updateDoc(userRef, {
    handle: h,
    hasRedefinedHandle: true,
  });
};

export const adminSetHandle = async (uid: string, rawHandle: string | null): Promise<void> => {
  if (!db || !uid) throw new Error('Parâmetros inválidos.');

  const userRef = doc(db, 'users', uid);

  if (!rawHandle || !rawHandle.trim()) {
    await updateDoc(userRef, { handle: null });
    return;
  }

  const validation = validateHandle(rawHandle);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const h = validation.handle;
  await checkHandleUniqueness(uid, h);

  await updateDoc(userRef, { handle: h });
};

export const updateUserDocFields = async (
  uid: string,
  fields: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'featuredTitleId' | 'featuredBadges'>>
): Promise<void> => {
  if (!db || !uid) return;
  await updateDoc(doc(db, 'users', uid), fields);
};

export const backfillShortIds = async (
  onProgress?: (done: number, total: number) => void
): Promise<{ filledCount: number; alreadyHadCount: number; totalCount: number }> => {
  if (!db) return { filledCount: 0, alreadyHadCount: 0, totalCount: 0 };

  const usersSnap = await getDocs(collection(db, 'users'));
  const allDocs = usersSnap.docs;
  const totalCount = allDocs.length;

  const existingShortIds = new Set<string>();
  allDocs.forEach((d) => {
    const data = d.data();
    if (typeof data.shortId === 'string' && data.shortId.trim()) {
      existingShortIds.add(data.shortId.trim());
    }
  });

  let filledCount = 0;
  let alreadyHadCount = 0;
  let processedCount = 0;

  const BATCH_SIZE = 400;

  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let batchHasUpdates = false;

    for (const d of chunk) {
      const data = d.data();
      const currentShortId = typeof data.shortId === 'string' ? data.shortId.trim() : '';

      if (currentShortId) {
        alreadyHadCount++;
      } else {
        const newShortId = ensureUniqueShortId(existingShortIds);
        existingShortIds.add(newShortId);
        batch.update(d.ref, { shortId: newShortId });
        batchHasUpdates = true;
        filledCount++;
      }

      processedCount++;
    }

    if (batchHasUpdates) {
      try {
        await batch.commit();
      } catch (err) {
        console.error('Error committing backfillShortIds batch:', err);
      }
    }

    if (onProgress) {
      onProgress(processedCount, totalCount);
    }
  }

  return { filledCount, alreadyHadCount, totalCount };
};
