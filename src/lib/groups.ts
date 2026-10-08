import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group, GroupFormData } from '../types/group';
import { unionUserPermissions, deriveIsStaff } from './permissions';

export const DEFAULT_GROUPS_SEEDS: Array<Omit<Group, 'createdAt'> & { id: string }> = [
  {
    id: 'visitante',
    name: 'Visitante',
    description: 'Grupo inicial de novos visitantes',
    color: '#C2C6CC',
    priority: 10,
    isStaff: false,
    isDefault: true,
    permissions: {
      admin: {
        accessPanel: false,
        manageUsers: false,
        manageGroups: false,
        manageBadges: false,
        manageForum: false,
        manageContent: false,
        manageCatalogs: false,
      },
      forum: { categories: {} },
    },
    createdBy: 'system',
  },
  {
    id: 'membro',
    name: 'Membro',
    description: 'Membro registrado da comuna',
    color: '#8BD0EF',
    priority: 40,
    isStaff: false,
    isDefault: false,
    permissions: {
      admin: {
        accessPanel: false,
        manageUsers: false,
        manageGroups: false,
        manageBadges: false,
        manageForum: false,
        manageContent: false,
        manageCatalogs: false,
      },
      forum: { categories: {} },
    },
    createdBy: 'system',
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Apoiador e explorador de destaque',
    color: '#EEBF71',
    priority: 70,
    isStaff: false,
    isDefault: false,
    permissions: {
      admin: {
        accessPanel: false,
        manageUsers: false,
        manageGroups: false,
        manageBadges: false,
        manageForum: false,
        manageContent: false,
        manageCatalogs: false,
      },
      forum: { categories: {} },
    },
    createdBy: 'system',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administração e governança da comuna',
    color: '#FCA5A5',
    priority: 100,
    isStaff: true,
    isDefault: false,
    permissions: {
      admin: {
        accessPanel: true,
        manageUsers: true,
        manageGroups: true,
        manageBadges: true,
        manageForum: true,
        manageContent: true,
        manageCatalogs: true,
      },
      forum: { categories: {} },
    },
    createdBy: 'system',
  },
];

const parseGroupDoc = (id: string, data: DocumentData): Group => {
  return {
    id,
    name: data.name || '',
    description: data.description || '',
    color: data.color || '#8BD0EF',
    priority: typeof data.priority === 'number' ? data.priority : 0,
    isStaff: !!data.isStaff,
    isDefault: !!data.isDefault,
    permissions: {
      admin: {
        accessPanel: !!data.permissions?.admin?.accessPanel,
        manageUsers: !!data.permissions?.admin?.manageUsers,
        manageGroups: !!data.permissions?.admin?.manageGroups,
        manageBadges: !!data.permissions?.admin?.manageBadges,
        manageForum: !!data.permissions?.admin?.manageForum,
        manageContent: !!data.permissions?.admin?.manageContent,
        manageCatalogs: !!data.permissions?.admin?.manageCatalogs,
      },
      forum: data.permissions?.forum || {},
    },
    chipStyle: data.chipStyle,
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
  };
};

export const listGroups = async (): Promise<Group[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'groups'), orderBy('priority', 'desc'));
    const snap = await getDocs(q);
    const groups: Group[] = [];
    snap.forEach((docSnap) => {
      groups.push(parseGroupDoc(docSnap.id, docSnap.data()));
    });
    return groups;
  } catch (error) {
    console.error('Error listing groups:', error);
    return [];
  }
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  if (!db || !groupId) return null;
  const normalizedId = groupId.trim().toLowerCase();
  try {
    const snap = await getDoc(doc(db, 'groups', normalizedId));
    if (snap.exists()) {
      return parseGroupDoc(snap.id, snap.data());
    }

    // Search all groups in case doc ID has a timestamp suffix or differs in case
    const allGroups = await listGroups();
    const found = allGroups.find(
      (g) => g.id.toLowerCase() === normalizedId || g.name.toLowerCase() === normalizedId
    );
    if (found) {
      return found;
    }

    const seed = DEFAULT_GROUPS_SEEDS.find((s) => s.id === normalizedId);
    if (seed) {
      return {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        color: seed.color,
        priority: seed.priority,
        isStaff: seed.isStaff,
        isDefault: seed.isDefault,
        permissions: seed.permissions,
        createdBy: seed.createdBy,
      } as unknown as Group;
    }
    return null;
  } catch (error) {
    console.error(`Error getting group ${groupId}:`, error);
    try {
      const allGroups = await listGroups();
      const found = allGroups.find(
        (g) => g.id.toLowerCase() === normalizedId || g.name.toLowerCase() === normalizedId
      );
      if (found) return found;
    } catch {
      // ignore listGroups fallback error
    }

    const seed = DEFAULT_GROUPS_SEEDS.find((s) => s.id === normalizedId);
    if (seed) {
      return {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        color: seed.color,
        priority: seed.priority,
        isStaff: seed.isStaff,
        isDefault: seed.isDefault,
        permissions: seed.permissions,
        createdBy: seed.createdBy,
      } as unknown as Group;
    }
    return null;
  }
};

export const countUsersInGroup = async (groupId: string): Promise<number> => {
  if (!db || !groupId) return 0;
  try {
    const qPrimary = query(collection(db, 'users'), where('primaryGroupId', '==', groupId));
    const qSecondary = query(
      collection(db, 'users'),
      where('secondaryGroupIds', 'array-contains', groupId)
    );
    const qLegacy = query(collection(db, 'users'), where('groupId', '==', groupId));

    const [snapP, snapS, snapL] = await Promise.all([
      getDocs(qPrimary).catch(() => null),
      getDocs(qSecondary).catch(() => null),
      getDocs(qLegacy).catch(() => null),
    ]);

    const userIds = new Set<string>();
    snapP?.forEach((d) => userIds.add(d.id));
    snapS?.forEach((d) => userIds.add(d.id));
    snapL?.forEach((d) => userIds.add(d.id));

    return userIds.size;
  } catch (error) {
    console.error(`Error counting users in group ${groupId}:`, error);
    return 0;
  }
};

let isSeeding = false;

export const seedDefaultGroups = async (): Promise<void> => {
  if (!db || isSeeding) return;
  isSeeding = true;
  try {
    const snap = await getDocs(collection(db, 'groups'));
    if (!snap.empty) {
      return;
    }

    for (const seed of DEFAULT_GROUPS_SEEDS) {
      const { id, ...data } = seed;
      await setDoc(doc(db, 'groups', id), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error seeding default groups:', error);
  } finally {
    isSeeding = false;
  }
};

export const recomputeUserDerivedFields = async (groupId: string): Promise<void> => {
  if (!db || !groupId) return;
  try {
    const allGroups = await listGroups();
    const groupMap = new Map<string, Group>();
    allGroups.forEach((g) => groupMap.set(g.id, g));

    const qPrimary = query(collection(db, 'users'), where('primaryGroupId', '==', groupId));
    const qSecondary = query(
      collection(db, 'users'),
      where('secondaryGroupIds', 'array-contains', groupId)
    );
    const qLegacy = query(collection(db, 'users'), where('groupId', '==', groupId));

    const [snapPrimary, snapSecondary, snapLegacy] = await Promise.all([
      getDocs(qPrimary),
      getDocs(qSecondary),
      getDocs(qLegacy),
    ]);

    const userDocsMap = new Map<string, DocumentData>();
    snapPrimary.forEach((d) => userDocsMap.set(d.id, d.data()));
    snapSecondary.forEach((d) => userDocsMap.set(d.id, d.data()));
    snapLegacy.forEach((d) => userDocsMap.set(d.id, d.data()));

    const userEntries = Array.from(userDocsMap.entries());
    const CHUNK_SIZE = 400;

    for (let i = 0; i < userEntries.length; i += CHUNK_SIZE) {
      const chunk = userEntries.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const [userId, userData] of chunk) {
        const pId = userData.primaryGroupId || userData.groupId || 'visitante';
        const sIds: string[] = Array.isArray(userData.secondaryGroupIds)
          ? userData.secondaryGroupIds
          : [];

        const userGroups: Group[] = [];
        const primaryG = groupMap.get(pId);
        if (primaryG) userGroups.push(primaryG);
        for (const sId of sIds) {
          const secG = groupMap.get(sId);
          if (secG) userGroups.push(secG);
        }

        const isStaff = deriveIsStaff(userGroups);
        const effectivePermissions = unionUserPermissions(userGroups);

        const userDocRef = doc(db, 'users', userId);
        batch.update(userDocRef, {
          isStaff,
          effectivePermissions,
        });
      }

      try {
        await batch.commit();
      } catch (batchErr) {
        console.error(
          'Falha ao atualizar lote de usuários sincronizando permissões de grupo:',
          batchErr
        );
        break; // Do not retry automatically
      }
    }
  } catch (err) {
    console.error(`Erro ao recomputar campos derivados para o grupo ${groupId}:`, err);
  }
};

export const createGroup = async (
  data: GroupFormData,
  createdBy: string
): Promise<{ id: string }> => {
  if (!db) throw new Error('Firebase DB indisponível');
  const firestoreDb = db;

  if (data.isDefault) {
    await unsetOtherDefaults('');
  }

  const baseId =
    data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'grupo';

  const existing = await getDoc(doc(firestoreDb, 'groups', baseId));
  const docId = existing.exists() ? `${baseId}-${Date.now().toString(36)}` : baseId;

  await setDoc(doc(firestoreDb, 'groups', docId), {
    ...data,
    createdAt: serverTimestamp(),
    createdBy,
  });

  return { id: docId };
};

export const updateGroup = async (
  groupId: string,
  data: Partial<GroupFormData>
): Promise<void> => {
  if (!db || !groupId) throw new Error('Parâmetros inválidos');
  const firestoreDb = db;

  if (data.isDefault) {
    await unsetOtherDefaults(groupId);
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.chipStyle === undefined) {
    updateData.chipStyle = deleteField();
  }

  await updateDoc(doc(firestoreDb, 'groups', groupId), updateData);
};

export const deleteGroup = async (
  groupId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!db || !groupId) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const group = await getGroup(groupId);
  if (!group) {
    return { success: false, error: 'Grupo não encontrado.' };
  }

  if (group.isDefault) {
    return {
      success: false,
      error: 'Não é possível excluir: este é o grupo padrão.',
    };
  }

  const memberCount = await countUsersInGroup(groupId);
  if (memberCount > 0) {
    return {
      success: false,
      error: 'Não é possível excluir: há usuários neste grupo.',
    };
  }

  try {
    await deleteDoc(doc(db, 'groups', groupId));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting group ${groupId}:`, error);
    return { success: false, error: 'Erro ao excluir o grupo no servidor.' };
  }
};

const unsetOtherDefaults = async (currentGroupId: string): Promise<void> => {
  if (!db) return;
  try {
    const q = query(collection(db, 'groups'), where('isDefault', '==', true));
    const snap = await getDocs(q);
    const updates = snap.docs
      .filter((d) => d.id !== currentGroupId)
      .map((d) => updateDoc(d.ref, { isDefault: false }));
    await Promise.all(updates);
  } catch (err) {
    console.error('Error unsetting other default groups:', err);
  }
};
